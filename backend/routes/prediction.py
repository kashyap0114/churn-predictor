from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import joblib
import json
import pandas as pd
from pathlib import Path
from ml.recommendations import get_recommendations

router = APIRouter()
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "churn_pipeline.pkl"
METRICS_PATH = BASE_DIR / "models" / "metrics.json"
DATA_PATH = BASE_DIR / "data" / "Telco_customer_churn.xlsx"

pipeline = joblib.load(MODEL_PATH)


def load_threshold(default: float = 0.62) -> float:
    """Read the production threshold from metrics.json (written by train.py)
    instead of hardcoding a second, independent copy of the number here."""
    try:
        with open(METRICS_PATH, "r", encoding="utf-8") as f:
            return float(json.load(f).get("threshold", default))
    except Exception:
        return default


CHURN_THRESHOLD = load_threshold()


class CustomerData(BaseModel):
    Contract: str
    InternetService: str
    OnlineSecurity: str
    TechSupport: str
    PaymentMethod: str
    MultipleLines: str
    Dependents: str
    StreamingMovies: str
    StreamingTV: str
    tenure: int
    OnlineBackup: str
    PaperlessBilling: str


def format_input(data: dict):
    return {
        "Contract": data["Contract"], "Internet Service": data["InternetService"],
        "Online Security": data["OnlineSecurity"], "Tech Support": data["TechSupport"],
        "Payment Method": data["PaymentMethod"], "Multiple Lines": data["MultipleLines"],
        "Dependents": data["Dependents"], "Streaming Movies": data["StreamingMovies"],
        "Streaming TV": data["StreamingTV"], "Tenure Months": data["tenure"],
        "Online Backup": data["OnlineBackup"], "Paperless Billing": data["PaperlessBilling"]
    }


def calculate_risk(prob: float):
    if prob < 0.30: return "Low"
    elif prob < CHURN_THRESHOLD: return "Medium"
    else: return "High"


def get_risk_factors(data: dict):
    factors = []
    if data["Contract"] == "Month-to-month": factors.append("Month-to-month contract")
    if data["tenure"] < 12: factors.append("Low customer tenure")
    if data["TechSupport"] == "No": factors.append("No technical support")
    if data["OnlineSecurity"] == "No": factors.append("No online security")
    if data["PaymentMethod"] == "Electronic check": factors.append("Electronic check payment")
    if data["InternetService"] == "Fiber optic": factors.append("Fiber optic internet service")
    return factors or ["No major risk factors detected"]


@router.post("/predict")
def predict_churn(customer: CustomerData):
    try:
        data_dict = customer.model_dump()
        df = pd.DataFrame([format_input(data_dict)])
        prob = float(pipeline.predict_proba(df)[0][1])
        risk_level = calculate_risk(prob)

        return {
            "prediction": "Churn" if prob >= CHURN_THRESHOLD else "No Churn",
            "probability": round(prob, 4),
            "probability_percent": round(prob * 100, 2),
            "risk_level": risk_level,
            "threshold": CHURN_THRESHOLD,
            "risk_factors": get_risk_factors(data_dict),
            "recommendations": get_recommendations(data_dict, risk_level) or ["Maintain current service levels"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/customers")
def get_customers():
    df = pd.read_excel(DATA_PATH)
    return df["CustomerID"].astype(str).str.strip().dropna().tolist()


@router.get("/customers/{customer_id}")
def get_customer(customer_id: str):
    df = pd.read_excel(DATA_PATH)
    customer = df[df["CustomerID"].astype(str).str.strip() == str(customer_id).strip()]
    if customer.empty: raise HTTPException(status_code=404, detail="Customer not found.")
    record = customer.iloc[0].where(pd.notnull(customer.iloc[0]), None).to_dict()
    record["customer_id"] = str(customer_id)
    return record