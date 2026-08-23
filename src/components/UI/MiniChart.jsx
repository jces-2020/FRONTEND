import React from 'react';

const COLORS = ['#3ab0e8', '#1a7ab5', '#4ecb8d', '#f4a533', '#e85c5c', '#9b6cdc', '#38b2ac', '#e8623a'];

function EmptyChart() {
  return (
    <div style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9bb', fontSize: '0.72rem' }}>
      Sin datos para graficar
    </div>
  );
}

function MiniBarChart({ data, xKey, yKey }) {
  if (!data?.length) return <EmptyChart />;
  const maxVal = Math.max(...data.map((d) => Number(d[yKey]) || 0), 1);
  const pad = { top: 10, right: 8, bottom: 46, left: 40 };
  const barW = Math.max(16, Math.min(36, Math.floor(280 / data.length) - 6));
  const w = Math.max(260, data.length * (barW + 8) + pad.left + pad.right);
  const h = 150;
  const chartH = h - pad.top - pad.bottom;
  return (
    <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: Math.max(w, 240), height: h, display: 'block' }}>
        <line x1={pad.left} y1={pad.top + chartH} x2={w - pad.right} y2={pad.top + chartH} stroke="rgba(70,165,220,0.25)" strokeWidth={1} />
        {data.map((d, i) => {
          const barH = Math.max(2, ((Number(d[yKey]) || 0) / maxVal) * chartH);
          const x = pad.left + i * (barW + 8);
          const y = pad.top + chartH - barH;
          const label = String(d[xKey] || '').slice(0, 14);
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} rx={2} fill={COLORS[i % COLORS.length]} opacity={0.88} />
              <text transform={`translate(${x + barW / 2},${pad.top + chartH + 8}) rotate(38)`} fontSize={9} fill="#3a6a8a" textAnchor="start">
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function MiniLineChart({ data, xKey, yKey }) {
  if (!data?.length) return <EmptyChart />;
  const vals = data.map((d) => Number(d[yKey]) || 0);
  const maxVal = Math.max(...vals, 1);
  const pad = { top: 10, right: 10, bottom: 46, left: 40 };
  const w = Math.max(260, data.length * 34 + pad.left + pad.right);
  const h = 150;
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;
  const stepX = chartW / Math.max(data.length - 1, 1);
  const toX = (i) => pad.left + i * stepX;
  const toY = (v) => pad.top + chartH - (v / maxVal) * chartH;
  const points = data.map((d, i) => `${toX(i)},${toY(Number(d[yKey]) || 0)}`).join(' ');
  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: Math.max(w, 240), height: h, display: 'block' }}>
        <line x1={pad.left} y1={pad.top + chartH} x2={w - pad.right} y2={pad.top + chartH} stroke="rgba(70,165,220,0.25)" strokeWidth={1} />
        <polyline points={points} fill="none" stroke="#3ab0e8" strokeWidth={2} strokeLinejoin="round" />
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={toX(i)} cy={toY(Number(d[yKey]) || 0)} r={3} fill="#1a7ab5" />
            <text transform={`translate(${toX(i)},${pad.top + chartH + 8}) rotate(38)`} fontSize={9} fill="#3a6a8a" textAnchor="start">
              {String(d[xKey] || '').slice(0, 12)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function MiniPieChart({ data, labelKey, valueKey }) {
  if (!data?.length) return <EmptyChart />;
  const total = data.reduce((s, d) => s + (Number(d[valueKey]) || 0), 0);
  if (!total) return <EmptyChart />;
  const r = 52;
  const cx = r + 10;
  const cy = r + 10;
  const h = (r + 10) * 2;
  let ang = -Math.PI / 2;
  const slices = data.slice(0, 8).map((d, i) => {
    const val = Number(d[valueKey]) || 0;
    const a = (val / total) * 2 * Math.PI;
    const end = ang + a;
    const x1 = cx + r * Math.cos(ang);
    const y1 = cy + r * Math.sin(ang);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    ang = end;
    return {
      path: `M${cx} ${cy} L${x1} ${y1} A${r} ${r} 0 ${a > Math.PI ? 1 : 0} 1 ${x2} ${y2}Z`,
      color: COLORS[i % COLORS.length],
      label: String(d[labelKey] || '').slice(0, 16),
      pct: ((val / total) * 100).toFixed(1),
    };
  });
  const w = cx * 2 + 150;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', maxWidth: 340, height: h, display: 'block' }}>
      {slices.map((s, i) => (
        <path key={i} d={s.path} fill={s.color} opacity={0.88} stroke="#fff" strokeWidth={1.5} />
      ))}
      {slices.map((s, i) => (
        <g key={i} transform={`translate(${cx * 2 + 6},${8 + i * 15})`}>
          <rect width={9} height={9} rx={2} fill={s.color} opacity={0.88} />
          <text x={13} y={8} fontSize={9} fill="#1a4a6a">
            {s.label} ({s.pct}%)
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function MiniChart({ chart }) {
  if (!chart?.type || !chart?.data?.length) return null;
  return (
    <div
      style={{
        marginTop: 8,
        background: 'rgba(255,255,255,0.7)',
        border: '1px solid rgba(70,165,220,0.2)',
        borderRadius: 10,
        padding: '8px 6px 4px',
      }}
    >
      {chart.type === 'bar' && <MiniBarChart data={chart.data} xKey={chart.x_key} yKey={chart.y_key} />}
      {chart.type === 'line' && <MiniLineChart data={chart.data} xKey={chart.x_key} yKey={chart.y_key} />}
      {chart.type === 'pie' && <MiniPieChart data={chart.data} labelKey={chart.label_key} valueKey={chart.value_key} />}
    </div>
  );
}
