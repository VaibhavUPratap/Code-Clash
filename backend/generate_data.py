import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import hashlib

def generate_synthetic_data(username="mock_user", days=90):
    """
    Generates a realistic social media dataset deterministically based on the username hash.
    Entering the same username will always yield the same data and anomaly pattern.
    """
    # Use username as seed for deterministic pseudo-random generation
    seed = int(hashlib.md5(username.encode()).hexdigest(), 16) % (2**32)
    np.random.seed(seed)
    
    start_date = datetime.now() - timedelta(days=days)
    data = []
    
    # Base metrics relative to username hash
    base_likes = 500 + (seed % 1000) * 10
    base_comments = 50 + (seed % 100) * 2
    base_shares = 20 + (seed % 50) * 2
    
    # Pre-select deterministic anomaly days
    anomaly_viral = (seed % 80) + 1
    anomaly_bot = ((seed * 2) % 80) + 1
    anomaly_crisis = ((seed * 3) % 80) + 1
    
    for i in range(days):
        current_date = start_date + timedelta(days=i)
        
        # Base gaussian noise
        likes = int(np.random.normal(base_likes, base_likes * 0.1))
        comments = int(np.random.normal(base_comments, base_comments * 0.1))
        shares = int(np.random.normal(base_shares, base_shares * 0.1))
        
        # Inject anomalies deterministically based on the user's specific "timeline destiny"
        if i == anomaly_viral:
            likes *= 5
            comments *= 4
            shares *= 8
            
        elif i == anomaly_bot:
            # Massive likes spike, no shares - classic botting 
            likes *= 10
            
        elif i == anomaly_crisis:
            # Likes drop but comments surge (controversy)
            likes = int(likes * 0.2)
            comments *= 3 
            shares = int(shares * 0.5)
            
        data.append({
            "date": current_date.strftime("%Y-%m-%d"),
            "likes": max(0, likes),
            "comments": max(0, comments),
            "shares": max(0, shares),
            "posts": 1,
        })
        
    df = pd.DataFrame(data)
    return df

if __name__ == "__main__":
    test_df = generate_synthetic_data("elonmusk")
    print(test_df.head())
