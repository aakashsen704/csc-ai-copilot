import React from 'react';

const SERVICES = [
  { id: 'pension', name: 'Old Age Pension', nameHi: 'वृद्धावस्था पेंशन', icon: '🏛️', reject: 31, level: 'high' },
  { id: 'birth', name: 'Birth Certificate', nameHi: 'जन्म प्रमाण पत्र', icon: '📋', reject: 8, level: 'low' },
  { id: 'caste', name: 'Caste Certificate', nameHi: 'जाति प्रमाण पत्र', icon: '📄', reject: 18, level: 'medium' },
  { id: 'domicile', name: 'Domicile Certificate', nameHi: 'निवास प्रमाण पत्र', icon: '🏠', reject: 15, level: 'medium' },
  { id: 'income', name: 'Income Certificate', nameHi: 'आय प्रमाण पत्र', icon: '💼', reject: 11, level: 'low' },
  { id: 'land', name: 'Land Record (B1)', nameHi: 'भूमि रिकॉर्ड बी-१', icon: '🗺️', reject: 26, level: 'high' },
];

const BADGE_COLORS = {
  high: { bg: 'rgba(192,57,43,0.1)', color: '#c0392b' },
  medium: { bg: 'rgba(230,126,34,0.1)', color: '#b36000' },
  low: { bg: 'rgba(39,174,96,0.1)', color: '#1e8449' },
};

export default function Sidebar({ currentService, onSelectService, dashboardStats }) {
  return (
    <aside style={{
      background: 'var(--bg2)',
      borderRight: '0.5px solid var(--border)',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      padding: '10px 8px',
      gap: 3,
    }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-hint)', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '6px 8px 4px' }}>
        Services / सेवाएं
      </div>

      {SERVICES.map(svc => {
        const isActive = currentService === svc.id;
        const badge = BADGE_COLORS[svc.level];
        return (
          <button
            key={svc.id}
            onClick={() => onSelectService(svc.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '8px 10px',
              borderRadius: 8,
              border: isActive ? '0.5px solid rgba(232,119,34,0.4)' : '0.5px solid transparent',
              background: isActive ? 'rgba(232,119,34,0.1)' : 'transparent',
              color: 'var(--text)',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              transition: 'all 0.12s',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg3)'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
          >
            <div style={{ width: 28, height: 28, borderRadius: 6, background: isActive ? 'rgba(232,119,34,0.15)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
              {svc.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{svc.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-devanagari)' }}>{svc.nameHi}</div>
            </div>
            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 20, fontWeight: 500, background: badge.bg, color: badge.color, flexShrink: 0 }}>
              {svc.reject}%
            </span>
          </button>
        );
      })}

      {/* Today's stats */}
      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-hint)', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '14px 8px 4px' }}>
        Today / आज
      </div>
      <div style={{ padding: '10px 12px', background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 9, margin: '0 2px' }}>
        {[
          { label: 'Applications', value: dashboardStats.todayApplications || 47, color: 'var(--text)' },
          { label: 'Accepted', value: Math.round((dashboardStats.todayApplications || 47) * 0.91), color: 'var(--gov-green)' },
          { label: 'Errors caught', value: dashboardStats.errorsCaughtToday || 4, color: 'var(--gov-orange)' },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: s.color }}>{s.value}</span>
          </div>
        ))}
        <div style={{ marginTop: 8, height: 3, background: 'var(--bg3)', borderRadius: 2 }}>
          <div style={{ height: '100%', width: `${dashboardStats.acceptanceRate || 91}%`, background: 'var(--gov-green)', borderRadius: 2 }} />
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{dashboardStats.acceptanceRate || 91}% acceptance rate today</div>
      </div>
    </aside>
  );
}
