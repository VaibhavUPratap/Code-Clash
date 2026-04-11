import React from 'react';
import Plot from 'react-plotly.js';

const Dashboard = ({ anomalies }) => {
  if (!anomalies || anomalies.length === 0) {
    return <div className="card"><p>No anomalies detected yet or dataset pending analysis.</p></div>;
  }

  // Build the data array for Plotly Timeline
  const timestamps = anomalies.map(a => a.timestamp);
  const values = anomalies.map(a => a.value);
  const colors = anomalies.map(a => a.type === 'spike' ? '#f59e0b' : '#ef4444');

  const plotData = [
    {
      x: timestamps,
      y: values,
      type: 'scatter',
      mode: 'markers+text',
      marker: { color: colors, size: 12 },
      name: 'Anomalies'
    }
  ];

  const layout = {
    title: 'Detected Anomalies Timeline',
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#f8fafc' },
    xaxis: { title: 'Date', gridcolor: 'rgba(255,255,255,0.1)' },
    yaxis: { title: 'Metric Value', gridcolor: 'rgba(255,255,255,0.1)' },
    margin: { t: 40, b:40, l: 40, r: 40 }
  };

  return (
    <div className="dashboard-grid">
      <div className="card">
         <Plot 
           data={plotData} 
           layout={layout} 
           style={{ width: "100%", height: "400px" }} 
           useResizeHandler={true} 
           config={{displayModeBar: false}} 
         />
      </div>
      
      <div className="card" style={{ maxHeight: '500px', overflowY: 'auto' }}>
        <h3>AI Insights & Alerts</h3>
        <div style={{marginTop: '1.5rem'}}>
          {anomalies.map((anom, idx) => {
            const aiInsight = anom.insight || {};
            // Determine badge color based on AI category insight
            let catClass = "anomaly-type-unknown";
            if (aiInsight.type === "viral") catClass = "anomaly-type-viral";
            if (aiInsight.type === "bot") catClass = "anomaly-type-bot";
            if (aiInsight.type === "crisis") catClass = "anomaly-type-crisis";

            return (
              <div key={idx} className={`anomaly-item ${anom.type}`}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                  <strong>{anom.timestamp}</strong>
                  <span className={catClass} style={{textTransform:'capitalize', fontWeight: 'bold'}}>
                    {aiInsight.type || 'Anomaly'}
                  </span>
                </div>
                <div style={{fontSize: '0.9rem'}}>
                  <div><strong>Metric:</strong> {anom.metric} ({anom.type}) - Value: {anom.value}</div>
                  <div style={{marginTop: '0.5rem'}}><strong>AI Cause:</strong> <br/> {aiInsight.cause || 'No reasoning provided.'}</div>
                  <div style={{color: 'var(--text-secondary)', marginTop: '8px', padding: '8px', background:'rgba(255,255,255,0.05)', borderRadius: '4px'}}>
                    <strong>Rec:</strong> <em>{aiInsight.recommendation || '-'}</em><br/>
                    (Confidence: {aiInsight.confidence || 'N/A'})
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
