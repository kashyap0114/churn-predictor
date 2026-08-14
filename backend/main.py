from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import prediction, analytics

app = FastAPI(title="Churn Predictor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint for frontend status indicator
@app.get("/api/health")
def health_check():
    return {"status": "ok"}

app.include_router(prediction.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)