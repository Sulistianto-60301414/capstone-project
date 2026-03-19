import json
from collections import Counter
from pathlib import Path

import joblib
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent


# =========================
# LOAD ARTIFACTS
# =========================
network_if = joblib.load(BASE_DIR / 'network_if.joblib')
network_rf = joblib.load(BASE_DIR / 'network_rf.joblib')
network_features = list(joblib.load(BASE_DIR / 'network_features.joblib'))
network_encoders = joblib.load(BASE_DIR / 'network_encoders.joblib')

process_if = joblib.load(BASE_DIR / 'process_if.joblib')
process_rf = joblib.load(BASE_DIR / 'process_rf.joblib')
process_features = list(joblib.load(BASE_DIR / 'process_features.joblib'))
process_encoders = joblib.load(BASE_DIR / 'process_encoders.joblib')

memory_if = joblib.load(BASE_DIR / 'memory_if.joblib')
memory_rf = joblib.load(BASE_DIR / 'memory_rf.joblib')
memory_features = list(joblib.load(BASE_DIR / 'memory_features.joblib'))
memory_encoders = joblib.load(BASE_DIR / 'memory_encoders.joblib')


# =========================
# HELPERS
# =========================
def apply_encoders(df: pd.DataFrame, encoders: dict) -> pd.DataFrame:
    df = df.copy()
    for col, le in encoders.items():
        if col not in df.columns:
            continue
        df[col] = df[col].astype(str)
        known = set(le.classes_)
        fallback = le.classes_[0]
        df[col] = df[col].apply(lambda value: value if value in known else fallback)
        df[col] = le.transform(df[col])
    return df


def align_features(df: pd.DataFrame, feature_list: list) -> pd.DataFrame:
    df = df.copy()
    for col in feature_list:
        if col not in df.columns:
            df[col] = 0
    return df[feature_list]


def normalize_attack_name(value) -> str:
    return str(value or 'normal').strip() or 'normal'


# =========================
# RULES
# =========================
def compute_network_rules(df: pd.DataFrame) -> pd.DataFrame:
    rules = pd.DataFrame(index=df.index)
    rules['rate_burst'] = (df['Rate'] > 596.789).astype(int) if 'Rate' in df.columns else 0
    rules['bytes_spike'] = (df['TotBytes'] > 682.0).astype(int) if 'TotBytes' in df.columns else 0
    rules['pkts_spike'] = (df['TotPkts'] > 7.0).astype(int) if 'TotPkts' in df.columns else 0
    rules['load_spike'] = (df['Load'] > 394676.8).astype(int) if 'Load' in df.columns else 0

    if 'SrcGap' in df.columns and 'DstGap' in df.columns:
        rules['gap_spike'] = ((df['SrcGap'] > 0.0) | (df['DstGap'] > 0.0)).astype(int)
    else:
        rules['gap_spike'] = 0

    if 'SrcJitter' in df.columns and 'DstJitter' in df.columns:
        rules['jitter_spike'] = ((df['SrcJitter'] > 19.5543534) | (df['DstJitter'] > 19.5543534)).astype(int)
    else:
        rules['jitter_spike'] = 0

    if 'Dur' in df.columns and 'TotPkts' in df.columns:
        rules['short_dur_many_pkts'] = ((df['Dur'] < 0.0100538) & (df['TotPkts'] > 7.0)).astype(int)
    else:
        rules['short_dur_many_pkts'] = 0

    if 'SrcBytes' in df.columns and 'DstBytes' in df.columns:
        asym = (df['SrcBytes'] + 1.0) / (df['DstBytes'] + 1.0)
        rules['asymmetry'] = ((asym > 10.0) | (asym < 0.1)).astype(int)
    else:
        rules['asymmetry'] = 0

    rules['rule_score'] = rules.sum(axis=1)
    rules['rules_flag'] = (rules['rule_score'] >= 1).astype(int)
    return rules


def compute_process_rules(df: pd.DataFrame) -> pd.DataFrame:
    rules = pd.DataFrame(index=df.index)
    rules['cpu_spike'] = (df['CPU'] > 0.03).astype(int) if 'CPU' in df.columns else 0
    rules['high_trun'] = (df['TRUN'] > 5).astype(int) if 'TRUN' in df.columns else 0
    rules['high_tslpi'] = (df['TSLPI'] > 5).astype(int) if 'TSLPI' in df.columns else 0
    rules['high_pri'] = (df['PRI'] > 100).astype(int) if 'PRI' in df.columns else 0
    rules['nice_abnormal'] = (df['NICE'] != 0).astype(int) if 'NICE' in df.columns else 0

    rules['state_suspicious'] = (
        df['State'].astype(str).isin(['d', 'z', '4', '5'])
        if 'State' in df.columns
        else 0
    )

    rules['rule_score'] = rules.sum(axis=1)
    rules['rules_flag'] = (rules['rule_score'] >= 1).astype(int)
    return rules


def compute_memory_rules(df: pd.DataFrame) -> pd.DataFrame:
    rules = pd.DataFrame(index=df.index)
    rules['rsize_spike'] = (df['RSIZE'] > 73908).astype(int) if 'RSIZE' in df.columns else 0
    rules['vgrow_spike'] = (df['VGROW'] > 256).astype(int) if 'VGROW' in df.columns else 0
    rules['rgrow_spike'] = (df['RGROW'] > 452).astype(int) if 'RGROW' in df.columns else 0
    rules['vsize_spike'] = (df['VSIZE'] > 22412).astype(int) if 'VSIZE' in df.columns else 0
    rules['minflt_spike'] = (df['MINFLT'] > 1963).astype(int) if 'MINFLT' in df.columns else 0
    rules['mem_spike'] = (df['MEM'] > 0.03).astype(int) if 'MEM' in df.columns else 0
    rules['majflt_spike'] = (df['MAJFLT'] > 0).astype(int) if 'MAJFLT' in df.columns else 0
    rules['rule_score'] = rules.sum(axis=1)
    rules['rules_flag'] = (rules['rule_score'] >= 1).astype(int)
    return rules


# =========================
# INPUT PREPARATION
# =========================
def build_memory_frame(network_df: pd.DataFrame, process_df: pd.DataFrame) -> pd.DataFrame:
    sample_memory_path = BASE_DIR / 'sample_memory.csv'
    if sample_memory_path.exists():
        sample_memory = pd.read_csv(sample_memory_path)
        if all(col in sample_memory.columns for col in memory_features):
            return sample_memory

    rows = []
    total = max(len(network_df), len(process_df))
    for idx in range(total):
        net = network_df.iloc[idx % len(network_df)]
        proc = process_df.iloc[idx % len(process_df)]
        pri = float(proc.get('PRI', 0) or 0)
        trun = float(proc.get('TRUN', 0) or 0)
        tslpi = float(proc.get('TSLPI', 0) or 0)
        cpu = float(proc.get('CPU', 0) or 0)
        cmd = int(float(proc.get('CMD', 0) or 0))
        tot_pkts = float(net.get('TotPkts', 0) or 0)
        tot_bytes = float(net.get('TotBytes', 0) or 0)
        load = float(net.get('Load', 0) or 0)

        rows.append({
            'MINFLT': int(1500 + idx * 120 + tot_pkts * 25),
            'MAJFLT': 1 if idx % 3 == 0 else 0,
            'VSTEXT': int(900 + pri * 5),
            'VSIZE': int(18000 + pri * 80 + tslpi * 200 + tot_bytes * 0.5),
            'RSIZE': int(50000 + pri * 100 + trun * 1500 + tot_bytes * 2),
            'VGROW': int(120 + tslpi * 20 + (load / 25000)),
            'RGROW': int(220 + trun * 50 + idx * 15 + tot_pkts * 3),
            'MEM': round(cpu * 8 + 0.01 * (idx % 4), 4),
            'CMD': cmd,
        })
    return pd.DataFrame(rows)


# =========================
# MODEL SCORING
# =========================
def score_component(component_name, label, part, raw_df, if_model, rf_model, features, encoders, drop_cols, rules_fn):
    X = raw_df.drop(columns=drop_cols, errors='ignore')
    X = apply_encoders(X, encoders)
    X = align_features(X, features)

    if_raw = pd.Series(if_model.predict(X), index=X.index).map({1: 0, -1: 1}).fillna(0).astype(int)
    if_scores = None
    if hasattr(if_model, 'decision_function'):
        if_scores = pd.Series(-if_model.decision_function(X), index=X.index)
    else:
        if_scores = pd.Series([0.0] * len(X), index=X.index)

    rules_df = rules_fn(raw_df)
    rules_flag = rules_df['rules_flag'].astype(int)
    hybrid_flag = ((if_raw == 1) | (rules_flag == 1)).astype(int)

    scaled_scores = pd.Series([0.0] * len(X), index=X.index)
    if len(if_scores):
        low = float(if_scores.min())
        high = float(if_scores.max())
        if abs(high - low) < 1e-9:
            scaled_scores = pd.Series([35.0 if hybrid_flag.iloc[i] else 0.0 for i in range(len(X))], index=X.index)
        else:
            scaled_scores = ((if_scores - low) / (high - low) * 100).clip(0, 100)
    scaled_scores = (scaled_scores + rules_flag * 15).clip(0, 100)

    rf_pred = pd.Series(rf_model.predict(X), index=X.index).map(normalize_attack_name)
    if hasattr(rf_model, 'predict_proba'):
        probabilities = pd.DataFrame(rf_model.predict_proba(X), index=X.index, columns=rf_model.classes_)
        confidence = probabilities.max(axis=1)
    else:
        confidence = pd.Series([0.0] * len(X), index=X.index)

    results = []
    for idx in X.index:
        anomaly = bool(hybrid_flag.loc[idx])
        attack_type = rf_pred.loc[idx] if anomaly else 'normal'
        attack_type = normalize_attack_name(attack_type)
        attacked = anomaly and attack_type.lower() != 'normal'
        results.append({
            'component': component_name,
            'label': label,
            'part': part,
            'anomaly': anomaly,
            'attackType': attack_type,
            'confidence': round(float(confidence.loc[idx]), 4),
            'anomalyScore': round(float(scaled_scores.loc[idx]), 2),
            'iforestFlag': bool(if_raw.loc[idx]),
            'rulesFlag': bool(rules_flag.loc[idx]),
            'attacked': attacked,
        })
    return results


# =========================
# FUSION
# =========================
def build_fusion_frame(index, network_result, process_result, memory_result):
    components = [network_result, process_result, memory_result]
    attacked = [item for item in components if item['attacked']]
    anomalous = [item for item in components if item['anomaly']]

    alert = bool(attacked) or len(anomalous) >= 2
    if len(attacked) >= 2:
        severity = 'high'
    elif len(attacked) == 1 or len(anomalous) >= 2:
        severity = 'medium'
    else:
        severity = 'low'

    triggered_by = [item['part'] for item in (attacked or anomalous)]
    attack_counter = Counter(item['attackType'] for item in attacked)
    final_attack = 'normal'
    if attack_counter:
        final_attack = attack_counter.most_common(1)[0][0]
    elif alert:
        final_attack = 'anomalous behavior'

    confidence_source = attacked or anomalous
    confidence = max((item['confidence'] for item in confidence_source), default=0.0)
    score_source = anomalous or components
    fusion_score = round(sum(item['anomalyScore'] for item in score_source) / len(score_source), 2)

    if not alert:
        report = 'No fused alert. All monitored parts are behaving normally.'
    elif attacked:
        report = (
            f"Fused alert triggered by {' + '.join(triggered_by)}. "
            f"Likely attack type: {final_attack}."
        )
    else:
        report = (
            f"Fused anomaly triggered by {' + '.join(triggered_by)}. "
            'The models agree that behavior is abnormal, but no attack class dominated.'
        )

    return {
        'index': index,
        'alert': alert,
        'severity': severity,
        'triggeredBy': triggered_by,
        'attackedParts': [item['part'] for item in attacked],
        'anomalousParts': [item['part'] for item in anomalous],
        'attackType': final_attack,
        'attackVotes': dict(attack_counter),
        'confidence': round(float(confidence), 4),
        'score': fusion_score,
        'report': report,
    }


# =========================
# MAIN
# =========================
def main():
    network_df = pd.read_csv(BASE_DIR / 'sample_network.csv')
    process_df = pd.read_csv(BASE_DIR / 'sample_process.csv')
    memory_df = build_memory_frame(network_df, process_df)

    total = max(len(network_df), len(process_df), len(memory_df))
    network_df = network_df.reindex(range(total), method='ffill')
    process_df = process_df.reindex(range(total), method='ffill')
    memory_df = memory_df.reindex(range(total), method='ffill')

    network_results = score_component(
        'network',
        'Network Model',
        'Network',
        network_df,
        network_if,
        network_rf,
        network_features,
        network_encoders,
        ['Label', 'Attack Category', 'label', 'type', 'label_group', 'type_group'],
        compute_network_rules,
    )
    process_results = score_component(
        'process',
        'Process Model',
        'Process',
        process_df,
        process_if,
        process_rf,
        process_features,
        process_encoders,
        ['PID', 'pid', 'label', 'type', 'label_group', 'type_group'],
        compute_process_rules,
    )
    memory_results = score_component(
        'memory',
        'Memory Model',
        'Memory',
        memory_df,
        memory_if,
        memory_rf,
        memory_features,
        memory_encoders,
        ['PID', 'pid', 'label', 'type', 'label_group', 'type_group'],
        compute_memory_rules,
    )

    output = []
    for idx in range(total):
        fusion = build_fusion_frame(idx, network_results[idx], process_results[idx], memory_results[idx])
        output.append({
            'network': network_results[idx],
            'process': process_results[idx],
            'memory': memory_results[idx],
            'fusion': fusion,
        })

    print(json.dumps(output))


if __name__ == '__main__':
    main()
