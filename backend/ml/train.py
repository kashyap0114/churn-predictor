import os
import json
import joblib
import pandas as pd
from sklearn.model_selection import StratifiedKFold, cross_validate
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

print("Loading dataset...")
df = pd.read_excel(DATA_PATH)
df = df.dropna(subset=[TARGET])
X = df[FEATURES].copy()
y = pd.to_numeric(df[TARGET], errors="coerce").astype(int)

cat_cols = [f for f in FEATURES if f != "Tenure Months"]
num_cols = ["Tenure Months"]

preprocessor = ColumnTransformer(
    transformers=[
        ("cat", Pipeline([("imputer", SimpleImputer(strategy="most_frequent")), ("onehot", OneHotEncoder(handle_unknown="ignore"))]), cat_cols),
        ("num", Pipeline([("imputer", SimpleImputer(strategy="median")), ("scaler", StandardScaler())]), num_cols)
    ]
)

scale_pos_weight = (y == 0).sum() / (y == 1).sum()

models = {
    "Logistic Regression": LogisticRegression(class_weight="balanced", max_iter=1000, random_state=42),
    "Decision Tree": DecisionTreeClassifier(class_weight="balanced", max_depth=5, random_state=42),
    "Random Forest": RandomForestClassifier(class_weight="balanced", n_estimators=200, random_state=42, n_jobs=-1),
    "Gradient Boosting": GradientBoostingClassifier(n_estimators=150, learning_rate=0.05, max_depth=3, random_state=42),
    "XGBoost": XGBClassifier(n_estimators=200, learning_rate=0.05, max_depth=4, subsample=0.8, colsample_bytree=0.8, scale_pos_weight=scale_pos_weight, eval_metric="logloss", random_state=42, n_jobs=-1)
}

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
all_model_metrics = {}

print("Evaluating 5 models using 5-Fold Cross Validation...")
for name, model in models.items():
    pipe = Pipeline([("preprocessor", preprocessor), ("classifier", model)])
    scores = cross_validate(pipe, X, y, cv=cv, scoring=["accuracy", "precision", "recall", "f1", "roc_auc"], n_jobs=-1)
    
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

# Fit final selected model on entire dataset
final_pipeline = Pipeline([("preprocessor", preprocessor), ("classifier", models[best_model_name])])
final_pipeline.fit(X, y)

# Generate confusion matrix at 0.62 threshold
probs_full = final_pipeline.predict_proba(X)[:, 1]
preds_full = (probs_full >= FINAL_THRESHOLD).astype(int)
cm = confusion_matrix(y, preds_full)

feature_importance = []
try:
    cols = final_pipeline.named_steps["preprocessor"].get_feature_names_out()
    imps = final_pipeline.named_steps["classifier"].feature_importances_
    feature_importance = [{"feature": f, "importance": float(i)} for f, i in sorted(zip(cols, imps), key=lambda x: x[1], reverse=True)]
except Exception as e:
    print("Feature importance error:", e)

# Save pipeline and metrics
joblib.dump(final_pipeline, os.path.join(MODEL_DIR, "churn_pipeline.pkl"))
with open(os.path.join(MODEL_DIR, "metrics.json"), "w", encoding="utf-8") as f:
    json.dump({
        "model": best_model_name,
        "selected_model": best_model_name,
        "threshold": FINAL_THRESHOLD,
        "models": all_model_metrics,
        "metrics": all_model_metrics[best_model_name],
        "confusion_matrix": {"TN": int(cm[0][0]), "FP": int(cm[0][1]), "FN": int(cm[1][0]), "TP": int(cm[1][1])},
        "feature_importance": feature_importance
    }, f, indent=4)

print("Final pipeline & metrics saved successfully!")