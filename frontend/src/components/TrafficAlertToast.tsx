import React from 'react';
import { TrafficAlert } from '../hooks/useTrafficAlerts';

interface Props {
  alerts: TrafficAlert[];
}

export const TrafficAlertToast: React.FC<Props> = ({ alerts }) => {
  const handleReroute = (clusterId: string) => {
    // Placeholder: could call backend API to request a new route
    console.log('🔁 Reroute requested for cluster', clusterId);
    // For now, just emit a socket event or show a message
  };

  return (
    <div
      aria-live="assertive"
      aria-atomic="true"
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 1000,
      }}
    >
      {alerts.map((alert) => (
        <div
          key={alert.id}
          role="alert"
          style={{
            background: 'rgba(255, 69, 0, 0.9)', // orange‑red for urgency
            color: '#fff',
            padding: '12px 16px',
            borderRadius: '6px',
            minWidth: '240px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <strong>{alert.message}</strong>
          <div style={{ fontSize: '0.85em' }}>
            {alert.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <button
            onClick={() => handleReroute(alert.clusterId)}
            style={{
              alignSelf: 'flex-end',
              background: 'rgba(0,0,0,0.2)',
              color: '#fff',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Reroute
          </button>
        </div>
      ))}
    </div>
  );
};
