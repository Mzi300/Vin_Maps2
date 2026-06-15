import React from 'react';
export const TrafficLegend = () => {
    const levels = [
        { level: 'CONGESTION', color: '#ff3b30', label: 'Severe Congestion' },
        { level: 'HIGH', color: '#ff9500', label: 'High Traffic' },
        { level: 'AVERAGE', color: '#ffcc00', label: 'Average Traffic' },
        { level: 'LOW', color: '#34c759', label: 'Low Traffic' },
    ];
    return (<div style={{ position: 'absolute', bottom: 20, left: 20, background: 'rgba(255,255,255,0.9)', padding: '8px 12px', borderRadius: '6px', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
      <h4 style={{ margin: 0, marginBottom: '4px', fontSize: '14px' }}>Traffic Legend</h4>
      {levels.map((l) => (<div key={l.level} style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
          <span style={{ width: '14px', height: '14px', backgroundColor: l.color, borderRadius: '50%', display: 'inline-block', marginRight: '6px' }}/>
          <span style={{ fontSize: '13px' }}>{l.label}</span>
        </div>))}
    </div>);
};
//# sourceMappingURL=TrafficLegend.js.map