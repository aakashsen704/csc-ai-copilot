import React, { useState } from 'react';
import { validatePincodeOffline } from '../../utils/validators';

const CG_BLOCKS = ['Rajnandgaon', 'Chhuikhadan', 'Khairagarh', 'Dongargarh', 'Dongargaon', 'Mohla', 'Manpur', 'Ambagarh Chowki', 'Chhuriya', 'Tirora'];

export default function AddressTab({ formData, onChange, serviceType }) {
  const [pinHint, setPinHint] = useState(null);
  const [yearsHint, setYearsHint] = useState(null);

  const handlePin = (val) => {
    onChange('pincode', val);
    if (val.length < 6) { setPinHint(null); return; }
    const r = validatePincodeOffline(val);
    setPinHint({ type: r.valid && !r.warning ? 'ok' : r.warning ? 'warning' : 'error', text: r.message || r.error });
  };

  const handleYears = (val) => {
    onChange('yearsAtAddress', val);
    const y = parseInt(val);
    if (isNaN(y)) { setYearsHint(null); return; }
    if (serviceType === 'pension' || serviceType === 'domicile') {
      if (y >= 15) setYearsHint({ type: 'ok', text: `${y} years — meets 15yr CG residency requirement` });
      else setYearsHint({ type: 'warning', text: `Only ${y} years — need 15+ for ${serviceType}` });
    }
  };

  return (
    <div style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 10, padding: 14 }}>
      <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-hint)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 12 }}>Current Address / वर्तमान पता</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10, marginBottom: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <label style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 500 }}>Village / Ward <span style={{ fontFamily: 'var(--font-devanagari)', fontSize: 10 }}>(गांव/वार्ड)</span></label>
          <input placeholder="Village or ward name" value={formData.village || ''} onChange={e => onChange('village', e.target.value)} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <label style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 500 }}>Panchayat <span style={{ fontFamily: 'var(--font-devanagari)', fontSize: 10 }}>(पंचायत)</span></label>
          <input placeholder="Panchayat name" value={formData.panchayat || ''} onChange={e => onChange('panchayat', e.target.value)} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <label style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 500 }}>Block <span style={{ fontFamily: 'var(--font-devanagari)', fontSize: 10 }}>(विकासखंड)</span></label>
          <select value={formData.block || ''} onChange={e => onChange('block', e.target.value)}>
            <option value="">Select Block</option>
            {CG_BLOCKS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <label style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 500 }}>Pincode <span style={{ fontFamily: 'var(--font-devanagari)', fontSize: 10 }}>(पिनकोड)</span></label>
          <input className={pinHint?.type === 'ok' ? 'valid' : pinHint?.type === 'warning' ? 'warning' : pinHint?.type === 'error' ? 'error' : ''} placeholder="6-digit pincode" maxLength={6} value={formData.pincode || ''} onChange={e => handlePin(e.target.value)} />
          {pinHint && <div style={{ fontSize: 10.5, color: pinHint.type === 'ok' ? 'var(--gov-green)' : pinHint.type === 'warning' ? 'var(--gov-amber)' : 'var(--gov-red)' }}>{pinHint.type === 'ok' ? '✓' : '⚠'} {pinHint.text}</div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <label style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 500 }}>Years at address <span style={{ fontFamily: 'var(--font-devanagari)', fontSize: 10 }}>(निवास वर्ष)</span></label>
          <input type="number" className={yearsHint?.type === 'ok' ? 'valid' : yearsHint?.type === 'warning' ? 'warning' : ''} placeholder="e.g. 20" min={0} max={100} value={formData.yearsAtAddress || ''} onChange={e => handleYears(e.target.value)} />
          {yearsHint && <div style={{ fontSize: 10.5, color: yearsHint.type === 'ok' ? 'var(--gov-green)' : 'var(--gov-amber)' }}>{yearsHint.type === 'ok' ? '✓' : '⚠'} {yearsHint.text}</div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <label style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 500 }}>District <span style={{ fontFamily: 'var(--font-devanagari)', fontSize: 10 }}>(जिला)</span></label>
          <input value="Rajnandgaon" readOnly style={{ background: 'var(--bg2)', color: 'var(--text-muted)' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <label style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 500 }}>State <span style={{ fontFamily: 'var(--font-devanagari)', fontSize: 10 }}>(राज्य)</span></label>
          <input value="Chhattisgarh" readOnly style={{ background: 'var(--bg2)', color: 'var(--text-muted)' }} />
        </div>
      </div>
    </div>
  );
}
