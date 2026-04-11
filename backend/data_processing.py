import pandas as pd

def preprocess_data(df):
    """
    Cleans and preprocesses the social media dataset for time-series analysis.
    Expected columns: timestamp, likes, comments, shares (or similar metrics)
    """
    # Create a copy to prevent SettingWithCopyWarning
    df = df.copy()
    
    # 1. Convert timestamp to datetime
    if 'timestamp' in df.columns:
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        # 2. Sort chronologically (critical for time series)
        df = df.sort_values(by='timestamp')
        
    # 3. Handle missing values (forward fill then backward fill)
    numeric_cols = df.select_dtypes(include=['number']).columns
    df[numeric_cols] = df[numeric_cols].ffill().bfill()
    
    # Optional enhancement based on data:
    # Resample daily if timestamps are sub-daily
    # e.g., df = df.set_index('timestamp').resample('D').sum().reset_index()
    
    return df
