import { AnalyzeResult } from '../services/api';
import { IpList } from './IpList';
import { Clock, Activity, FileDigit } from 'lucide-react';
import './ResultsDashboard.css';

interface ResultsDashboardProps {
  result: AnalyzeResult;
}

export function ResultsDashboard({ result }: ResultsDashboardProps) {
  return (
    <div className="dashboard-container">
      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-icon-wrapper">
            <Activity size={24} className="stat-icon" />
          </div>
          <div className="stat-info">
            <h4>Total Requests</h4>
            <p className="text-gradient">{result.totalRequests.toLocaleString()}</p>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon-wrapper">
            <Clock size={24} className="stat-icon" />
          </div>
          <div className="stat-info">
            <h4>Processing Time</h4>
            <p className="text-gradient">{result.processingTimeMs.toFixed(2)} ms</p>
          </div>
        </div>
        
        <div className="stat-card glass-panel">
          <div className="stat-icon-wrapper">
            <FileDigit size={24} className="stat-icon" />
          </div>
          <div className="stat-info">
            <h4>Unique IPs Found</h4>
            <p className="text-gradient">{result.topIps.length}</p>
          </div>
        </div>
      </div>

      <div className="ip-list-container glass-panel">
        <div className="list-header">
          <h3>Top IP Addresses</h3>
          <p>Most frequent requesters sorted by count</p>
        </div>
        <IpList topIps={result.topIps} total={result.totalRequests} />
      </div>
    </div>
  );
}
