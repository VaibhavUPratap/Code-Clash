import numpy as np
import pandas as pd

def detect_anomalies_zscore(df, metric_col, window=7, threshold=2.5):
    """
    Detects anomalies using a rolling window Z-score.
    Good for detecting sudden spikes/drops relative to recent trends.
    """
    # Calculate rolling mean and std
    rolling_mean = df[metric_col].rolling(window=window, min_periods=1).mean()
    rolling_std = df[metric_col].rolling(window=window, min_periods=1).std()
    
    # Prevent division by zero
    rolling_std = rolling_std.replace(0, 1).fillna(1)
    
    # Calculate Z-score
    z_scores = (df[metric_col] - rolling_mean) / rolling_std
    
    anomalies = []
    for idx, z in enumerate(z_scores):
        if abs(z) > threshold:
            anom_type = "spike" if z > 0 else "drop"
            timestamp = str(df.iloc[idx]['timestamp'].date()) if 'timestamp' in df.columns else str(idx)
            
            anomalies.append({
                "timestamp": timestamp,
                "metric": metric_col,
                "value": int(df.iloc[idx][metric_col]),
                "z_score": round(float(z), 2),
                "type": anom_type,
                "method": "z-score"
            })
            
    return anomalies

def detect_anomalies_iqr(df, metric_col):
    """
    Detects anomalies using the Interquartile Range (IQR).
    Good for identifying global outliers across the entire lifetime dataset.
    """
    Q1 = df[metric_col].quantile(0.25)
    Q3 = df[metric_col].quantile(0.75)
    IQR = Q3 - Q1
    
    lower_bound = Q1 - 1.5 * IQR
    upper_bound = Q3 + 1.5 * IQR
    
    anomalies = []
    for idx, row in df.iterrows():
        val = row[metric_col]
        if val < lower_bound or val > upper_bound:
            anom_type = "spike" if val > upper_bound else "drop"
            timestamp = str(row['timestamp'].date()) if 'timestamp' in df.columns else str(idx)
            
            anomalies.append({
                "timestamp": timestamp,
                "metric": metric_col,
                "value": int(val),
                "z_score": None, # Not applicable for IQR
                "type": anom_type,
                "method": "iqr"
            })
            
    return anomalies

def run_detection_pipeline(df, metrics=['likes', 'comments', 'shares']):
    """
    Runs both detection methods across metrics and returns a deduplicated list.
    """
    all_anomalies = []
    
    for metric in metrics:
        if metric in df.columns:
            all_anomalies.extend(detect_anomalies_zscore(df, metric))
            all_anomalies.extend(detect_anomalies_iqr(df, metric))
            
    # Deduplicate: prefer Z-score if both triggered for same timestamp/metric
    deduped = {}
    for a in all_anomalies:
        key = f"{a['timestamp']}_{a['metric']}"
        if key not in deduped or a['method'] == 'z-score':
            deduped[key] = a
            
    # Sort chronologically
    results = list(deduped.values())
    results.sort(key=lambda x: x['timestamp'])
    
    return results
