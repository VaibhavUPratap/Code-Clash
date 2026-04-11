import pandas as pd
import os

def load_data(file_path: str) -> pd.DataFrame:
    """
    Load CSV using pandas, convert 'date' column to datetime, 
    set 'date' as index, and return DataFrame.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
        
    df = pd.read_csv(file_path)
    if 'date' in df.columns:
        df['date'] = pd.to_datetime(df['date'])
        df.set_index('date', inplace=True)
    return df
