import { TopIp } from '../services/api';
import './IpList.css';

interface IpListProps {
  topIps: TopIp[];
  total: number;
}

export function IpList({ topIps }: IpListProps) {
  if (!topIps || topIps.length === 0) {
    return <p className="empty-message">No IPs found in the log file.</p>;
  }

  // Find the maximum count to calculate relative bar widths
  const maxCount = Math.max(...topIps.map(ip => ip.count));

  return (
    <div className="ip-list">
      <div className="ip-list-header">
        <div className="col-rank">#</div>
        <div className="col-ip">IP Address</div>
        <div className="col-count">Requests</div>
        <div className="col-chart">Frequency</div>
      </div>
      
      <div className="ip-list-body">
        {topIps.map((ipData, index) => {
          const widthPercent = (ipData.count / maxCount) * 100;
          
          return (
            <div className="ip-row" key={ipData.ip} style={{ animationDelay: `${index * 0.05}s` }}>
              <div className="col-rank">{index + 1}</div>
              <div className="col-ip font-mono">{ipData.ip}</div>
              <div className="col-count">
                <span className="count-badge">{ipData.count.toLocaleString()}</span>
              </div>
              <div className="col-chart">
                <div className="progress-bar-bg">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${widthPercent}%` }}
                  ></div>
                </div>
                <span className="percentage-text">{ipData.percentage.toFixed(2)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
