import joblib
import pandas as pd

# Load frozen artifacts
if_pipe = joblib.load("iforest_pipe.joblib")
rf_pipe = joblib.load("rf_pipe.joblib")
FEATURES = joblib.load("features.joblib")

def score_one(flow: dict, attack_threshold: float = 0.5):
    # Build 1-row dataframe in the same feature order used in training
    row = {k: flow.get(k, None) for k in FEATURES}
    X_one = pd.DataFrame([row], columns=FEATURES)

    # Stage 1: Isolation Forest (1=inlier, -1=outlier)
    is_anomalous = (int(if_pipe.predict(X_one)[0]) == -1)

    out = {"is_anomalous": is_anomalous}

    # Optional anomaly score
    if hasattr(if_pipe, "score_samples"):
        out["anomaly_score"] = float(if_pipe.score_samples(X_one)[0])
    elif hasattr(if_pipe, "decision_function"):
        out["anomaly_score"] = float(if_pipe.decision_function(X_one)[0])
    else:
        out["anomaly_score"] = None

    # Stage 2: Random Forest only if anomalous
    if is_anomalous:
        if hasattr(rf_pipe, "predict_proba"):
            p = float(rf_pipe.predict_proba(X_one)[0][1])
            out["attack_probability"] = p
            out["is_attack"] = (p >= attack_threshold)
        else:
            pred = int(rf_pipe.predict(X_one)[0])
            out["is_attack"] = (pred == 1)
            out["attack_probability"] = None
    else:
        out["is_attack"] = False
        out["attack_probability"] = 0.0

    return out

# Load a sample row from your dataset (adjust path if needed)
df = pd.read_csv("wustl-ehms-2020_with_attacks_categories-checkpoint.csv")

# Build X the same way you did in training: just use FEATURES
sample = df[FEATURES].iloc[0].to_dict()

print(score_one(sample))
