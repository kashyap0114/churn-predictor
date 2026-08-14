from fastapi import APIRouter, HTTPException
import pandas as pd
import json
from pathlib import Path

router = APIRouter()

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "Telco_customer_churn.xlsx"
MODEL_PATH = BASE_DIR / "models" / "metrics.json"

@router.get("/dashboard")
def get_dashboard_data():
    try:
        df = pd.read_excel(DATA_PATH)
        df.columns = df.columns.str.strip()
        
        total = len(df)
        churned = int((df["Churn Value"] == 1).sum())
        churn_rate = round((churned / total) * 100, 1) if total > 0 else 0
        avg_charges = round(pd.to_numeric(df["Monthly Charges"], errors="coerce").mean(), 2)

        contract_dist = df.groupby("Contract")["Churn Value"].mean().to_dict()
        internet_dist = df.groupby("Internet Service")["Churn Value"].mean().to_dict()
        
        bins = [0, 12, 24, 48, 60, 100]
        labels = ["0-12m", "13-24m", "25-48m", "49-60m", "60m+"]
        df["TenureGroup"] = pd.cut(pd.to_numeric(df["Tenure Months"], errors="coerce"), bins=bins, labels=labels)
        tenure_dist = df.groupby("TenureGroup", observed=False)["Churn Value"].mean().fillna(0).to_dict()

        return {
            "kpis": {
                "Total Customers": total,
                "Churned Customers": churned,
                "Churn Rate": f"{churn_rate}%",
                "Avg Monthly Charges": f"${avg_charges}"
            },
            "charts": {
                "churn_by_contract": [{"name": str(k), "churn_rate": round(v * 100, 1)} for k, v in contract_dist.items()],
                "churn_by_internet": [{"name": str(k), "churn_rate": round(v * 100, 1)} for k, v in internet_dist.items()],
                "churn_by_tenure": [{"name": str(k), "churn_rate": round(v * 100, 1)} for k, v in tenure_dist.items()]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/model-performance")
def get_model_performance():
    try:
        # The new metrics.json is already perfectly formatted, so we just return it directly!
        with open(MODEL_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="metrics.json not found. Run train.py first.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))