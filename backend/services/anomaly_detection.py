import pandas as pd

def detect_anomalies(df: pd.DataFrame, metric: str = 'likes') -> list:
    """
    Detect anomalies (spikes and drops) using Z-score.
    Returns list of anomalies.
    """
    anomalies_list = []
    
    if metric not in df.columns:
        return anomalies_list
        
    # Calculate mean and standard deviation
    mean_val = df[metric].mean()
    std_val = df[metric].std()
    
    if pd.isna(std_val) or std_val == 0:
        return anomalies_list
        
    # Compute Z-score for each row
    z_scores = (df[metric] - mean_val) / std_val
    
    for date_idx, z_score in z_scores.items():
        if z_score > 2:
            anomaly_type = "spike"
        elif z_score < -2:
            anomaly_type = "drop"
        else:
            continue
            
        anomalies_list.append({
            "date": date_idx.strftime('%Y-%m-%d') if isinstance(date_idx, pd.Timestamp) else str(date_idx),
            "value": float(df.loc[date_idx, metric]),
            "z_score": round(float(z_score), 2),
            "type": anomaly_type
        })
        
    return anomalies_list
