import json
import sys
from pathlib import Path

import joblib
import pandas as pd

BASE = Path(__file__).resolve().parent
FEATURES = joblib.load(BASE / "feature" / "features.joblib")
IFOREST = joblib.load(BASE / "models" / "iforest_pipe.joblib")
RF = joblib.load(BASE / "models" / "rf_pipe.joblib")


def score_one(flow: dict):
    row = {key: flow.get(key, None) for key in FEATURES}
    X = pd.DataFrame([row], columns=FEATURES)

    anomalous = int(IFOREST.predict(X)[0]) == -1
    if hasattr(IFOREST, "score_samples"):
        anomaly_score = float(IFOREST.score_samples(X)[0])
    elif hasattr(IFOREST, "decision_function"):
        anomaly_score = float(IFOREST.decision_function(X)[0])
    else:
        anomaly_score = 0.0

    result = {
        "is_anomalous": anomalous,
        "anomaly_score": anomaly_score,
        "attack_probability": 0.0,
        "attack_prediction": "normal",
        "classes": [],
    }

    if anomalous:
        prediction = RF.predict(X)[0]
        result["attack_prediction"] = str(prediction)
        classes = getattr(RF, "classes_", None)
        if classes is None and hasattr(RF, "named_steps"):
            last = list(RF.named_steps.values())[-1]
            classes = getattr(last, "classes_", None)
        if classes is not None:
            result["classes"] = [str(item) for item in classes]
        if hasattr(RF, "predict_proba"):
            probs = RF.predict_proba(X)[0]
            if result["classes"]:
                mapping = dict(zip(result["classes"], [float(v) for v in probs]))
                result["class_probabilities"] = mapping
                result["attack_probability"] = float(max(probs))
            else:
                result["attack_probability"] = float(max(probs))

    return result


if __name__ == "__main__":
    payload = json.loads(sys.stdin.read())
    print(json.dumps(score_one(payload)))
