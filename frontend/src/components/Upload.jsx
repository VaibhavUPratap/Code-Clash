import React, { useState } from 'react';

const Upload = ({ onAnalyzeSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const { analyzeData } = await import('../services/api');
      const result = await analyzeData(file);
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
      <h2>Upload Social Media Data (CSV)</h2>
      <p className="subtitle">Upload your dataset to begin anomaly detection and AI analysis.</p>
      
      <input type="file" accept=".csv" onChange={handleFileChange} />
      
      {error && <div style={{color: 'var(--danger)', marginTop: '1rem'}}>{error}</div>}
      
      {loading ? (
        <div className="loader"></div>
      ) : (
        <button 
           className="btn-primary" 
           onClick={handleUpload} 
           disabled={!file}
           style={{ marginTop: '1rem' }}
        >
          Analyze Data
        </button>
      )}
    </div>
  );
};

export default Upload;
