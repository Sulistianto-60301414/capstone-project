import joblib
import pandas as pd


# =========================
# LOAD SAVED ARTIFACTS
# =========================
network_if = joblib.load("network_if.joblib")
network_rf = joblib.load("network_rf.joblib")
network_features = joblib.load("network_features.joblib")
network_encoders = joblib.load("network_encoders.joblib")

process_if = joblib.load("process_if.joblib")
process_rf = joblib.load("process_rf.joblib")
process_features = joblib.load("process_features.joblib")
process_encoders = joblib.load("process_encoders.joblib")

memory_if = joblib.load("memory_if.joblib")
memory_rf = joblib.load("memory_rf.joblib")
memory_features = joblib.load("memory_features.joblib")
memory_encoders = joblib.load("memory_encoders.joblib")


# =========================
# HELPER: SAFE ENCODING
# =========================
def apply_encoders(df: pd.DataFrame, encoders: dict) -> pd.DataFrame:
    df = df.copy()

    for col, le in encoders.items():
        if col in df.columns:
            df[col] = df[col].astype(str)

            known = set(le.classes_)
            fallback = le.classes_[0]

            df[col] = df[col].apply(lambda x: x if x in known else fallback)
            df[col] = le.transform(df[col])

    return df


# =========================
# HELPER: ALIGN FEATURES
# =========================
def align_features(df: pd.DataFrame, feature_list: list) -> pd.DataFrame:
    df = df.copy()

    for col in feature_list:
        if col not in df.columns:
            df[col] = 0

    df = df[feature_list]
    return df


# =========================
# NETWORK RULES
# =========================
def compute_network_rules(df: pd.DataFrame) -> pd.DataFrame:
    rules = pd.DataFrame(index=df.index)

    rules["rate_burst"] = (df["Rate"] > 596.789).astype(int) if "Rate" in df.columns else 0
    rules["bytes_spike"] = (df["TotBytes"] > 682.0).astype(int) if "TotBytes" in df.columns else 0
    rules["pkts_spike"] = (df["TotPkts"] > 7.0).astype(int) if "TotPkts" in df.columns else 0
    rules["load_spike"] = (df["Load"] > 394676.79999999993).astype(int) if "Load" in df.columns else 0

    if "SrcGap" in df.columns and "DstGap" in df.columns:
        rules["gap_spike"] = ((df["SrcGap"] > 0.0) | (df["DstGap"] > 0.0)).astype(int)
    else:
        rules["gap_spike"] = 0

    if "SrcJitter" in df.columns and "DstJitter" in df.columns:
        rules["jitter_spike"] = (
            (df["SrcJitter"] > 19.55435339999995) | (df["DstJitter"] > 19.55435339999995)
        ).astype(int)
    else:
        rules["jitter_spike"] = 0

    if "Dur" in df.columns and "TotPkts" in df.columns:
        rules["short_dur_many_pkts"] = ((df["Dur"] < 0.0100538) & (df["TotPkts"] > 7.0)).astype(int)
    else:
        rules["short_dur_many_pkts"] = 0

    if "SrcBytes" in df.columns and "DstBytes" in df.columns:
        asym = (df["SrcBytes"] + 1.0) / (df["DstBytes"] + 1.0)
        rules["asymmetry"] = ((asym > 10.0) | (asym < 0.1)).astype(int)
    else:
        rules["asymmetry"] = 0

    rules["rule_score"] = rules.sum(axis=1)
    rules["rules_flag"] = (rules["rule_score"] >= 1).astype(int)
    return rules


# =========================
# PROCESS RULES
# =========================
def compute_process_rules(df: pd.DataFrame) -> pd.DataFrame:
    rules = pd.DataFrame(index=df.index)

    rules["cpu_spike"] = (df["CPU"] > 0.03).astype(int) if "CPU" in df.columns else 0
    rules["high_trun"] = (df["TRUN"] > 5).astype(int) if "TRUN" in df.columns else 0
    rules["high_tslpi"] = (df["TSLPI"] > 5).astype(int) if "TSLPI" in df.columns else 0
    rules["high_pri"] = (df["PRI"] > 100).astype(int) if "PRI" in df.columns else 0
    rules["nice_abnormal"] = (df["NICE"] != 0).astype(int) if "NICE" in df.columns else 0

    suspicious_cmds = {
        "gnome-system-m", "php5", "xargs", "awk",
        "<apport-gtk>", "<imageio>", "sessionclean"
    }

    if "CMD" in df.columns:
        rules["cmd_suspicious"] = df["CMD"].astype(str).isin(suspicious_cmds).astype(int)
    elif "cmd" in df.columns:
        rules["cmd_suspicious"] = df["cmd"].astype(str).isin(suspicious_cmds).astype(int)
    else:
        rules["cmd_suspicious"] = 0

    if "State" in df.columns:
        rules["state_suspicious"] = df["State"].astype(str).isin(["d", "z"]).astype(int)
    elif "state" in df.columns:
        rules["state_suspicious"] = df["state"].astype(str).isin(["d", "z"]).astype(int)
    else:
        rules["state_suspicious"] = 0

    rules["rule_score"] = rules.sum(axis=1)
    rules["rules_flag"] = (rules["rule_score"] >= 1).astype(int)
    return rules


# =========================
# MEMORY RULES
# =========================
def compute_memory_rules(df: pd.DataFrame) -> pd.DataFrame:
    rules = pd.DataFrame(index=df.index)

    rules["rsize_spike"] = (df["RSIZE"] > 73908).astype(int) if "RSIZE" in df.columns else 0
    rules["vgrow_spike"] = (df["VGROW"] > 256).astype(int) if "VGROW" in df.columns else 0
    rules["rgrow_spike"] = (df["RGROW"] > 452).astype(int) if "RGROW" in df.columns else 0
    rules["vsize_spike"] = (df["VSIZE"] > 22412).astype(int) if "VSIZE" in df.columns else 0
    rules["minflt_spike"] = (df["MINFLT"] > 1963).astype(int) if "MINFLT" in df.columns else 0

    rules["mem_spike"] = (df["MEM"] > 0.03).astype(int) if "MEM" in df.columns else 0
    rules["majflt_spike"] = (df["MAJFLT"] > 0).astype(int) if "MAJFLT" in df.columns else 0

    suspicious_cmds = {
        "gnome-system-m", "php5", "xargs", "awk",
        "<apport-gtk>", "<imageio>", "sessionclean"
    }

    if "CMD" in df.columns:
        rules["cmd_suspicious"] = df["CMD"].astype(str).isin(suspicious_cmds).astype(int)
    elif "cmd" in df.columns:
        rules["cmd_suspicious"] = df["cmd"].astype(str).isin(suspicious_cmds).astype(int)
    else:
        rules["cmd_suspicious"] = 0

    rules["rule_score"] = rules.sum(axis=1)
    rules["rules_flag"] = (rules["rule_score"] >= 1).astype(int)
    return rules


# =========================
# NETWORK SCORING
# =========================
def score_network(df: pd.DataFrame) -> pd.DataFrame:
    raw_df = df.copy()

    X = raw_df.drop(columns=["Label", "Attack Category", "label", "type", "label_group", "type_group"], errors="ignore")
    X = apply_encoders(X, network_encoders)
    X = align_features(X, network_features)

    if_pred_raw = network_if.predict(X)
    if_flag = pd.Series(if_pred_raw, index=X.index).map({1: 0, -1: 1})

    rules_df = compute_network_rules(raw_df)
    rules_flag = rules_df["rules_flag"]

    hybrid_flag = ((if_flag == 1) | (rules_flag == 1)).astype(int)

    attack_type = pd.Series("normal", index=X.index)
    anomaly_idx = hybrid_flag[hybrid_flag == 1].index

    if len(anomaly_idx) > 0:
        attack_type.loc[anomaly_idx] = network_rf.predict(X.loc[anomaly_idx])

    return pd.DataFrame({
        "anomaly_flag": hybrid_flag,
        "attack_type": attack_type
    })


# =========================
# PROCESS SCORING
# =========================
def score_process(df: pd.DataFrame) -> pd.DataFrame:
    raw_df = df.copy()

    X = raw_df.drop(columns=["PID", "pid", "label", "type", "label_group", "type_group"], errors="ignore")
    X = apply_encoders(X, process_encoders)
    X = align_features(X, process_features)

    if_pred_raw = process_if.predict(X)
    if_flag = pd.Series(if_pred_raw, index=X.index).map({1: 0, -1: 1})

    rules_df = compute_process_rules(raw_df)
    rules_flag = rules_df["rules_flag"]

    hybrid_flag = ((if_flag == 1) | (rules_flag == 1)).astype(int)

    attack_type = pd.Series("normal", index=X.index)
    anomaly_idx = hybrid_flag[hybrid_flag == 1].index

    if len(anomaly_idx) > 0:
        attack_type.loc[anomaly_idx] = process_rf.predict(X.loc[anomaly_idx])

    return pd.DataFrame({
        "anomaly_flag": hybrid_flag,
        "attack_type": attack_type
    })


# =========================
# MEMORY SCORING
# =========================
def score_memory(df: pd.DataFrame) -> pd.DataFrame:
    raw_df = df.copy()

    X = raw_df.drop(columns=["PID", "pid", "label", "type", "label_group", "type_group"], errors="ignore")
    X = apply_encoders(X, memory_encoders)
    X = align_features(X, memory_features)

    if_pred_raw = memory_if.predict(X)
    if_flag = pd.Series(if_pred_raw, index=X.index).map({1: 0, -1: 1})

    rules_df = compute_memory_rules(raw_df)
    rules_flag = rules_df["rules_flag"]

    hybrid_flag = ((if_flag == 1) | (rules_flag == 1)).astype(int)

    attack_type = pd.Series("normal", index=X.index)
    anomaly_idx = hybrid_flag[hybrid_flag == 1].index

    if len(anomaly_idx) > 0:
        attack_type.loc[anomaly_idx] = memory_rf.predict(X.loc[anomaly_idx])

    return pd.DataFrame({
        "anomaly_flag": hybrid_flag,
        "attack_type": attack_type
    })


# =========================
# EXAMPLE USAGE
# =========================
if __name__ == "__main__":
    df_net = pd.read_csv("sample_network.csv")
    print(score_network(df_net).head())

    df_proc = pd.read_csv("sample_process.csv")
    print(score_process(df_proc).head())

    df_mem = pd.read_csv("sample_memory.csv")
    print(score_memory(df_mem).head())
    pass