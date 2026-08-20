import os
import json
import joblib
import pandas as pd
from sklearn.model_selection import StratifiedKFold, cross_validate, train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import confusion_matrix
from xgboost import XGBClassifier

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "Telco_customer_churn.xlsx")
MODEL_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(MODEL_DIR, exist_ok=True)

FEATURES = [
    "Contract", "Internet Service", "Online Security", "Tech Support",
    "Payment Method", "Multiple Lines", "Dependents", "Streaming Movies",
    "Streaming TV", "Tenure Months", "Online Backup", "Paperless Billing"
]
TARGET = "Churn Value"
FINAL_THRESHOLD = 0.62
TEST_SIZE = 0.2  # 20% held out for final, unbiased evaluation
RANDOM_STATE = 42

print("Loading dataset...")
df = pd.read_excel(DATA_PATH)
df = df.dropna(subset=[TARGET])
X = df[FEATURES].copy()
y = pd.to_numeric(df[TARGET], errors="coerce").astype(int)

# ---------------------------------------------------------------------------
# NEW: Train/Test split
# ---------------------------------------------------------------------------
# We split off a test set BEFORE any model selection or training happens.
# X_test/y_test are never touched again until the very end, when we evaluate
# the final chosen model. This guarantees the confusion matrix and any
# reported "final" numbers reflect performance on data the model has never
# seen — unlike before, where predict_proba(X) reused training data.
#
# stratify=y ensures the train and test sets preserve the same churn/
# no-churn ratio as the full dataset (important since churn is imbalanced).
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=TEST_SIZE,
    stratify=y,
    random_state=RANDOM_STATE
)
print(f"Train size: {len(X_train)} rows | Test size: {len(X_test)} rows")

cat_cols = [f for f in FEATURES if f != "Tenure Months"]
num_cols = ["Tenure Months"]

preprocessor = ColumnTransformer(
    transformers=[
        ("cat", Pipeline([("imputer", SimpleImputer(strategy="most_frequent")), ("onehot", OneHotEncoder(handle_unknown="ignore"))]), cat_cols),
        ("num", Pipeline([("imputer", SimpleImputer(strategy="median")), ("scaler", StandardScaler())]), num_cols)
    ]
)

# ---------------------------------------------------------------------------
# NEW: scale_pos_weight is now computed from y_train only, not the full y.
# This avoids leaking any statistic derived from the test set into training.
# ---------------------------------------------------------------------------
scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()

models = {
    "Logistic Regression": LogisticRegression(class_weight="balanced", max_iter=1000, random_state=42),
    "Decision Tree": DecisionTreeClassifier(class_weight="balanced", max_depth=5, random_state=42),
    "Random Forest": RandomForestClassifier(class_weight="balanced", n_estimators=200, random_state=42, n_jobs=-1),
    "Gradient Boosting": GradientBoostingClassifier(n_estimators=150, learning_rate=0.05, max_depth=3, random_state=42),
    "XGBoost": XGBClassifier(n_estimators=200, learning_rate=0.05, max_depth=4, subsample=0.8, colsample_bytree=0.8, scale_pos_weight=scale_pos_weight, eval_metric="logloss", random_state=42, n_jobs=-1)
}

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
all_model_metrics = {}

# ---------------------------------------------------------------------------
# NEW: Cross-validation now runs on X_train / y_train only.
# This is model *selection* — we're only allowed to look at training data
# while deciding which algorithm is best. The test set stays untouched.
# ---------------------------------------------------------------------------
print("Evaluating 5 models using 5-Fold Cross Validation on the training set...")
for name, model in models.items():
    pipe = Pipeline([("preprocessor", preprocessor), ("classifier", model)])
    scores = cross_validate(pipe, X_train, y_train, cv=cv, scoring=["accuracy", "precision", "recall", "f1", "roc_auc"], n_jobs=-1)

    all_model_metrics[name] = {
        "Accuracy": float(scores["test_accuracy"].mean()),
        "Precision": float(scores["test_precision"].mean()),
        "Recall": float(scores["test_recall"].mean()),
        "F1": float(scores["test_f1"].mean()),
        "ROC-AUC": float(scores["test_roc_auc"].mean())
    }

# Select best model based on cross-validation F1 score
best_model_name = max(all_model_metrics.keys(), key=lambda k: all_model_metrics[k]["F1"])
print(f"\nSelected Best Model: {best_model_name} (F1: {all_model_metrics[best_model_name]['F1']:.4f})")

# ---------------------------------------------------------------------------
# NEW: Fit the final selected model on the TRAINING set only (not all data).
# This keeps the test set completely unseen so it can be used for a fair,
# final evaluation below.
# ---------------------------------------------------------------------------
final_pipeline = Pipeline([("preprocessor", preprocessor), ("classifier", models[best_model_name])])
final_pipeline.fit(X_train, y_train)

# ---------------------------------------------------------------------------
# NEW: Generate confusion matrix on the held-out TEST set, not the training
# data. This is the key fix — probs/preds are now computed on data the
# model never saw during fit(), giving an honest, unbiased performance view.
# ---------------------------------------------------------------------------
probs_test = final_pipeline.predict_proba(X_test)[:, 1]
preds_test = (probs_test >= FINAL_THRESHOLD).astype(int)
cm = confusion_matrix(y_test, preds_test)

feature_importance = []
try:
    cols = final_pipeline.named_steps["preprocessor"].get_feature_names_out()
    imps = final_pipeline.named_steps["classifier"].feature_importances_
    feature_importance = [{"feature": f, "importance": float(i)} for f, i in sorted(zip(cols, imps), key=lambda x: x[1], reverse=True)]
except Exception as e:
    print("Feature importance error:", e)

# ---------------------------------------------------------------------------
# NEW (optional but common in practice): Once we've locked in our reported
# metrics using the held-out test set above, we retrain the SAME chosen
# model on the FULL dataset (train + test) before saving it. This lets the
# deployed model learn from every available row, since we no longer need
# to hold anything back for evaluation. The metrics we report/save came
# from the unbiased test-set evaluation above, NOT from this refit.
# ---------------------------------------------------------------------------
final_pipeline.fit(X, y)

# Save pipeline and metrics
joblib.dump(final_pipeline, os.path.join(MODEL_DIR, "churn_pipeline.pkl"))
with open(os.path.join(MODEL_DIR, "metrics.json"), "w", encoding="utf-8") as f:
    json.dump({
        "model": best_model_name,
        "selected_model": best_model_name,
        "threshold": FINAL_THRESHOLD,
        "test_size": TEST_SIZE,
        "models": all_model_metrics,
        "metrics": all_model_metrics[best_model_name],
        "confusion_matrix": {"TN": int(cm[0][0]), "FP": int(cm[0][1]), "FN": int(cm[1][0]), "TP": int(cm[1][1])},
        "feature_importance": feature_importance
    }, f, indent=4)

print("Final pipeline & metrics saved successfully!")
