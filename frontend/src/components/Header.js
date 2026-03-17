import React from 'react';

export default function Header({ isOnline, networkType, isSimulatingOffline, onToggleOffline }) {
  return (
    <header style={{
      background: 'var(--gov-navy)',
      height: 'var(--header-height)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      flexShrink: 0,
      boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, background: 'var(--gov-orange)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#fff', letterSpacing: '-0.5px', flexShrink: 0 }}>
          CSC
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#fff', letterSpacing: '0.2px' }}>CSC AI Co-Pilot · Rajnandgaon District</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-devanagari)' }}>AI सहायक — Common Service Centre Operator Tool</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Gov branding */}
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', borderRight: '0.5px solid rgba(255,255,255,0.15)', paddingRight: 16, fontFamily: 'var(--font-devanagari)' }}>
          भारत सरकार · Chhattisgarh
        </div>

        {/* Network status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'rgba(255,255,255,0.8)' }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: isOnline ? '#2ecc71' : '#e74c3c',
            display: 'inline-block',
            animation: isOnline ? 'none' : 'blink 1.5s infinite'
          }} />
          {isOnline ? `Online · ${networkType === 'unknown' ? '4G' : networkType.toUpperCase()}` : 'Offline · Edge AI'}
        </div>

        {/* Offline toggle */}
        <button
          onClick={onToggleOffline}
          style={{
            fontSize: 10.5,
            padding: '3px 10px',
            border: '0.5px solid rgba(255,255,255,0.2)',
            borderRadius: 5,
            background: isSimulatingOffline ? 'rgba(192,57,43,0.3)' : 'transparent',
            color: isSimulatingOffline ? '#ff7f7f' : 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          title="Simulate offline mode for testing"
        >
          {isSimulatingOffline ? '● Offline Mode ON' : 'Simulate Offline'}
        </button>

        {/* Operator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: '0.5px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 500 }}>
            OP
          </div>
          <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.8)' }}>Operator</span>
        </div>
      </div>
    </header>
  );
}
