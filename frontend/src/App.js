import React, { useState } from 'react';
import './index.css';
import Upload from './components/Upload';
import Dashboard from './components/Dashboard';

function App() {
  const [anomalies, setAnomalies] = useState([]);

  return (
    <div className="app-container">
      <header>
        <h1>Social Media Trend Anomaly Finder</h1>
        <p className="subtitle">Crisis & Bot Intelligence System</p>
      </header>
      
      <Upload onAnalyzeSuccess={(data) => setAnomalies(data)} />
      
      {anomalies.length > 0 && (
         <Dashboard anomalies={anomalies} />
      )}
    </div>
  );
}

export default App;
