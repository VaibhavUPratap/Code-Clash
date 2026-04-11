import pandas as pd

def preprocess_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Sort by date, handle missing values (forward fill then backward fill),
    and ensure data is clean.
    """
    if df.empty:
        return df
        
    # Sort by date (which is the index)
    df = df.sort_index()
    
    # Handle missing values using forward fill, then backward fill for any remaining
    df = df.ffill().bfill()
    
    return df
