import React, { useState } from 'react';

const Upload = ({ onAnalyzeSuccess }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!username.trim()) {
      setError("Please enter a valid social media username.");
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const { analyzeData } = await import('../services/api');
      // Pass the username cleanly
      const result = await analyzeData(username.replace('@', ''));
      if (result.status === "success") {
        onAnalyzeSuccess(result.data.anomalies);
      } else {
        setError(result.error || "Analysis failed.");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Unable to connect to the backend (ensure Flask is running on port 5000).");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card upload-container">
      <h2>Analyze Social Media Profile</h2>
      <p className="subtitle">Enter any target username to instantly analyze engagement logic and intercept anomalies.</p>
      
      <div style={{display: 'flex', gap: '1rem', width: '100%', maxWidth: '400px', marginTop: '1rem'}}>
        <input 
          type="text" 
          placeholder="@username" 
          value={username}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(0,0,0,0.2)',
            color: 'white',
            outline: 'none',
            fontSize: '1rem'
          }}
        />
        {loading ? (
          <div className="loader" style={{margin: '0', width: '30px', height: '30px', borderTopColor: 'var(--success)'}}></div>
        ) : (
          <button 
             className="btn-primary" 
             onClick={handleSearch} 
             disabled={!username.trim()}
          >
            Analyze
          </button>
        )}
      </div>
      
      {error && <div style={{color: 'var(--danger)', marginTop: '1rem'}}>{error}</div>}
      
    </div>
  );
};

export default Upload;
