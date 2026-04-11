import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

def generate_synthetic_data(filename="social_media_data.csv", days=90):
    start_date = datetime.now() - timedelta(days=days)
    
    data = []
    
    # Base baseline metrics
    base_likes = 500
    base_comments = 50
    base_shares = 20
    
    for i in range(days):
        current_date = start_date + timedelta(days=i)
        
        # Add random noise
        likes = int(np.random.normal(base_likes, base_likes * 0.1))
        comments = int(np.random.normal(base_comments, base_comments * 0.1))
        shares = int(np.random.normal(base_shares, base_shares * 0.1))
        
        # Inject anomalies
        # 1. Viral Spike (all metrics go way up, maybe Day 30)
        if i == 30:
            likes *= 5
            comments *= 4
            shares *= 8
            
        # 2. Bot Activity Spike (only likes go up massively, Day 60)
        elif i == 60:
            likes *= 10
            # comments and shares stay relatively normal
            
        # 3. Crisis Drop (metrics plummet, but comments spike - Day 80)
        elif i == 80:
            likes = int(likes * 0.2)
            comments *= 3 # people complaining!
            shares = int(shares * 0.5)
            
        data.append({
            "timestamp": current_date.strftime("%Y-%m-%d"),
            "likes": max(0, likes),
            "comments": max(0, comments),
            "shares": max(0, shares)
        })
        
    df = pd.DataFrame(data)
    
    # Save the synthetic data
    df.to_csv(filename, index=False)
    print(f"Synthetic data successfully generated with {days} days of data at {filename}")

if __name__ == "__main__":
    generate_synthetic_data()
