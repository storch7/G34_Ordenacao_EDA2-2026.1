import { Activity } from 'lucide-react';
import './Header.css';

export function Header() {
  return (
    <header className="header glass-panel">
      <div className="header-logo">
        <div className="icon-wrapper">
          <Activity size={28} className="pulse-icon" />
        </div>
        <h1 className="text-gradient">RadixWatch</h1>
      </div>
      <p className="header-description">
        High-Performance Log Analysis & IP Sorting
      </p>
    </header>
  );
}
