import React, { useState, useCallback } from 'react';
import { validateAadhaarOffline, validateIFSCOffline, validateMobileOffline, validateAgeOffline } from '../../utils/validators';
import { validateAPI } from '../../utils/api';

function FormCard({ title, children }) {
  return (
    <div style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 10, padding: 14, marginBottom: 12 }}>
      <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-hint)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

function FormGroup({ label, labelHi, children, hint }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <label style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 500, display: 'flex', gap: 5, alignItems: 'baseline' }}>
        {label}
        {labelHi && <span style={{ fontSize: 10, fontFamily: 'var(--font-devanagari)', opacity: 0.7 }}>{labelHi}</span>}
      </label>
      {children}
      {hint && (
        <div style={{ fontSize: 10.5, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2, color: hint.type === 'error' ? 'var(--gov-red)' : hint.type === 'warning' ? 'var(--gov-amber)' : 'var(--gov-green)' }}>
          {hint.type === 'error' ? '✗' : hint.type === 'warning' ? '⚠' : '✓'} {hint.text}
        </div>
      )}
    </div>
  );
}

const GRID2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 };

export default function PersonalTab({ formData, onChange, serviceType, isOnline, setAiMessages }) {
  const [hints, setHints] = useState({});

  const setHint = useCallback((field, hint) => setHints(prev => ({ ...prev, [field]: hint })), []);

  const handleAadhaar = async (val) => {
    onChange('aadhaar', val);
    const clean = val.replace(/\s/g, '');
    if (clean.length < 12) { setHint('aadhaar', clean.length > 0 ? { type: 'warning', text: `${clean.length}/12 digits` } : null); return; }
    const r = validateAadhaarOffline(val);
    setHint('aadhaar', r.valid ? { type: 'ok', text: r.message_hi || r.message } : { type: 'error', text: r.error });
    if (r.valid && isOnline) {
      try { const res = await validateAPI.aadhaar(val); if (res) setHint('aadhaar', { type: res.valid ? 'ok' : 'error', text: res.message || res.error }); } catch {}
    }
  };

  const handleIFSC = async (val) => {
    const upper = val.toUpperCase();
    onChange('ifscCode', upper);
    if (upper.length < 11) { setHint('ifsc', null); return; }
    const r = validateIFSCOffline(upper);
    setHint('ifsc', r.valid ? { type: 'ok', text: r.message } : { type: 'error', text: r.error });
    if (!r.valid) setAiMessages(prev => [...prev, { id: Date.now(), role: 'assistant', type: 'alert-error', text: `⛔ IFSC "${upper}" is invalid. Format: 4 letters + "0" + 6 alphanumeric (e.g. SBIN0001234). Wrong IFSC causes 28% of pension rejections.`, hindi: 'IFSC गलत है। उदाहरण: SBIN0001234' }]);
  };

  const handleMobile = (val) => {
    onChange('mobile', val);
    if (val.length < 10) { setHint('mobile', null); return; }
    const r = validateMobileOffline(val);
    setHint('mobile', r.valid ? { type: 'ok', text: r.message_hi } : { type: 'error', text: r.error });
  };

  const handleDob = (val) => {
    onChange('dob', val);
    if (!val) { setHint('dob', null); return; }
    const r = validateAgeOffline(val, serviceType);
    setHint('dob', r.valid ? { type: 'ok', text: r.message_hi || r.message } : { type: 'error', text: r.error });
    if (!r.valid && serviceType === 'pension') setAiMessages(prev => [...prev, { id: Date.now(), role: 'assistant', type: 'alert-error', text: `⛔ Age check failed: applicant is ${r.age} years old. Old Age Pension requires minimum age of 60. This application will be rejected.`, hindi: `आयु ${r.age} वर्ष — पेंशन के लिए 60 वर्ष आवश्यक।` }]);
  };

  const getClass = (field) => {
    const h = hints[field];
    if (!h) return '';
    return h.type === 'ok' ? 'valid' : h.type === 'error' ? 'error' : 'warning';
  };

  return (
    <>
      <FormCard title="Applicant Details / आवेदक विवरण">
        <div style={GRID2}>
          <FormGroup label="Full Name" labelHi="(पूरा नाम)">
            <input className={formData.fullName?.length > 2 ? 'valid' : ''} placeholder="As on Aadhaar" value={formData.fullName || ''} onChange={e => onChange('fullName', e.target.value)} />
          </FormGroup>
          <FormGroup label="Aadhaar Number" labelHi="(आधार नं.)" hint={hints.aadhaar}>
            <input className={getClass('aadhaar')} placeholder="XXXX XXXX XXXX" maxLength={14} value={formData.aadhaar || ''} onChange={e => handleAadhaar(e.target.value)} />
          </FormGroup>
          <FormGroup label="Date of Birth" labelHi="(जन्म तिथि)" hint={hints.dob}>
            <input type="date" className={getClass('dob')} value={formData.dob || ''} onChange={e => handleDob(e.target.value)} />
          </FormGroup>
          <FormGroup label="Gender" labelHi="(लिंग)">
            <select value={formData.gender || ''} onChange={e => onChange('gender', e.target.value)}>
              <option value="">Select / चुनें</option>
              <option value="male">Male / पुरुष</option>
              <option value="female">Female / महिला</option>
              <option value="other">Other / अन्य</option>
            </select>
          </FormGroup>
          <FormGroup label="Mobile Number" labelHi="(मोबाइल नं.)" hint={hints.mobile}>
            <input className={getClass('mobile')} placeholder="10-digit number" maxLength={10} value={formData.mobile || ''} onChange={e => handleMobile(e.target.value)} />
          </FormGroup>
          <FormGroup label="Category" labelHi="(श्रेणी)">
            <select value={formData.category || ''} onChange={e => onChange('category', e.target.value)}>
              <option value="">Select / चुनें</option>
              <option value="general">General / सामान्य</option>
              <option value="obc">OBC / ओबीसी</option>
              <option value="sc">SC / अनुसूचित जाति</option>
              <option value="st">ST / अनुसूचित जनजाति</option>
            </select>
          </FormGroup>
        </div>
      </FormCard>

      {(serviceType === 'pension' || serviceType === 'income') && (
        <FormCard title="Bank Details / बैंक विवरण">
          <div style={GRID2}>
            <FormGroup label="Bank Account No." labelHi="(खाता नं.)">
              <input placeholder="Account number" value={formData.bankAccount || ''} onChange={e => onChange('bankAccount', e.target.value)} className={formData.bankAccount?.length >= 9 ? 'valid' : ''} />
            </FormGroup>
            <FormGroup label="IFSC Code" labelHi="(आईएफएससी)" hint={hints.ifsc}>
              <input className={getClass('ifsc')} placeholder="e.g. SBIN0001234" maxLength={11} value={formData.ifscCode || ''} onChange={e => handleIFSC(e.target.value)} style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }} />
            </FormGroup>
            <FormGroup label="Bank Name" labelHi="(बैंक नाम)">
              <input placeholder="e.g. State Bank of India" value={formData.bankName || ''} onChange={e => onChange('bankName', e.target.value)} />
            </FormGroup>
            {serviceType === 'income' && (
              <FormGroup label="Annual Income (₹)" labelHi="(वार्षिक आय)">
                <input type="number" placeholder="e.g. 75000" value={formData.annualIncome || ''} onChange={e => onChange('annualIncome', e.target.value)} className={formData.annualIncome && parseInt(formData.annualIncome) < 100000 ? 'valid' : formData.annualIncome && parseInt(formData.annualIncome) >= 100000 ? 'error' : ''} />
              </FormGroup>
            )}
          </div>
        </FormCard>
      )}
    </>
  );
}
