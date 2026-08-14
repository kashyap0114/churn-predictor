def get_recommendations(customer_data: dict, risk_level: str) -> list:
    recommendations = []

    if risk_level in ["Medium", "High"]:
        if customer_data.get("Contract") == "Month-to-month":
            recommendations.append("Offer a discounted 1-year or 2-year contract.")
        if customer_data.get("TechSupport") == "No":
            recommendations.append("Provide a free trial of technical support.")
        if customer_data.get("OnlineSecurity") == "No":
            recommendations.append("Bundle online security to strengthen the value of the plan.")
        if int(customer_data.get("tenure", 0)) < 6:
            recommendations.append("Initiate early-retention onboarding call to ensure service satisfaction.")

    if not recommendations and risk_level == "High":
        recommendations.append("Schedule an immediate customer success follow-up.")

    return recommendations[:3]