import React, { useMemo } from 'react';

const ELIGIBILITY_RULES = {
  pension: [
    { id: 'age', label: 'Age ≥ 60 years required', labelHi: 'आयु 60+ वर्ष आवश्यक', check: (f) => f.dob ? Math.floor((Date.now() - new Date(f.dob)) / (365.25*24*3600*1000)) >= 60 : null },
    { id: 'cg', label: 'Chhattisgarh domicile (15+ years)', labelHi: 'छत्तीसगढ़ निवास (15+ वर्ष)', check: (f) => f.yearsAtAddress ? parseInt(f.yearsAtAddress) >= 15 : null },
    { id: 'income', label: 'Annual income below ₹1 lakh', labelHi: 'वार्षिक आय ₹1 लाख से कम', check: (f) => f.annualIncome ? parseInt(f.annualIncome) < 100000 : null },
    { id: 'pension_other', label: 'Not receiving other govt pension', labelHi: 'अन्य सरकारी पेंशन नहीं', check: () => null },
    { id: 'bank', label: 'Valid bank account (DBT-linked)', labelHi: 'बैंक खाता (DBT-लिंक)', check: (f) => f.bankAccount ? f.bankAccount.length >= 9 : null },
  ],
  birth: [
    { id: 'timing', label: 'Application within 21 days of birth', labelHi: '21 दिन के भीतर आवेदन', check: () => null },
    { id: 'hospital', label: 'Hospital record available', labelHi: 'अस्पताल रिकॉर्ड उपलब्ध', check: () => null },
  ],
  caste: [
    { id: 'cg_resident', label: 'Chhattisgarh resident', labelHi: 'छत्तीसगढ़ निवासी', check: () => true },
    { id: 'parent_proof', label: "Parent's caste documented", labelHi: 'माता/पिता का जाति दस्तावेज़', check: () => null },
  ],
  domicile: [
    { id: 'years', label: '15+ years CG residency', labelHi: '15+ वर्ष छ.ग. निवास', check: (f) => f.yearsAtAddress ? parseInt(f.yearsAtAddress) >= 15 : null },
    { id: 'address_proof', label: 'Multiple address proofs', labelHi: 'एकाधिक पता प्रमाण', check: () => null },
  ],
  income: [
    { id: 'income_source', label: 'Income source verifiable', labelHi: 'आय स्रोत सत्यापन योग्य', check: () => null },
    { id: 'bank_active', label: 'Active bank account', labelHi: 'सक्रिय बैंक खाता', check: (f) => f.bankAccount ? f.bankAccount.length >= 9 : null },
  ],
  land: [
    { id: 'khasra', label: 'Valid Khasra number', labelHi: 'सही खसरा नंबर', check: () => null },
    { id: 'owner_match', label: 'Name matches revenue records', labelHi: 'नाम राजस्व रिकॉर्ड से मेल', check: () => null },
  ],
};

const FALLBACK_PATTERNS = {
  pension: [
    { reason: 'Age proof missing', reason_hi: 'आयु प्रमाण अनुपस्थित', percentage: 43 },
    { reason: 'Incorrect IFSC code', reason_hi: 'गलत IFSC कोड', percentage: 28 },
    { reason: 'DOB mismatch', reason_hi: 'जन्म तिथि मेल नहीं', percentage: 19 },
    { reason: 'Income exceeds limit', reason_hi: 'आय सीमा से अधिक', percentage: 10 },
  ],
  birth: [
    { reason: 'Hospital certificate missing', reason_hi: 'अस्पताल प्रमाण पत्र नहीं', percentage: 55 },
    { reason: 'Name mismatch', reason_hi: 'नाम मेल नहीं', percentage: 25 },
    { reason: 'Late application', reason_hi: '21 दिन बाद आवेदन', percentage: 20 },
  ],
  caste: [
    { reason: 'Wrong form', reason_hi: 'गलत फॉर्म', percentage: 38 },
    { reason: 'Caste proof missing', reason_hi: 'जाति प्रमाण नहीं', percentage: 35 },
    { reason: 'Verification pending', reason_hi: 'सत्यापन लंबित', percentage: 27 },
  ],
};

export default function EligibilityTab({ formData, serviceType, uploadedDocs, rejectionPatterns }) {
  const rules = ELIGIBILITY_RULES[serviceType] || [];
  const patterns = (rejectionPatterns[serviceType]) || FALLBACK_PATTERNS[serviceType] || FALLBACK_PATTERNS.pension;
  const sortedPatterns = [...patterns].sort((a, b) => (b.percentage || 0) - (a.percentage || 0));

  const checkResults = useMemo(() => rules.map(rule => {
    const result = rule.check(formData);
    return { ...rule, status: result === true ? 'ok' : result === false ? 'error' : 'unknown' };
  }), [formData, rules]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 10, padding: 14 }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-hint)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 12 }}>Pre-submission Eligibility Inference / पात्रता जांच</div>
        {checkResults.map(r => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '7px 0', borderBottom: '0.5px solid var(--border)' }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0, marginTop: 1, background: r.status === 'ok' ? 'rgba(39,174,96,0.15)' : r.status === 'error' ? 'rgba(192,57,43,0.15)' : 'rgba(230,126,34,0.12)', color: r.status === 'ok' ? 'var(--gov-green)' : r.status === 'error' ? 'var(--gov-red)' : 'var(--gov-amber)' }}>
              {r.status === 'ok' ? '✓' : r.status === 'error' ? '✗' : '?'}
            </div>
            <div>
              <div style={{ fontSize: 12.5, color: 'var(--text)' }}>{r.label}</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: 'var(--font-devanagari)', marginTop: 2 }}>{r.labelHi}{r.status === 'unknown' ? ' — enter data to verify / डेटा दर्ज करें' : ''}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 10, padding: 14 }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-hint)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 12 }}>Top Rejection Reasons · Rajnandgaon / अस्वीकृति कारण</div>
        {sortedPatterns.map((p, i) => {
          const pct = p.percentage || 0;
          const color = pct > 35 ? 'var(--gov-red)' : pct > 20 ? 'var(--gov-amber)' : 'var(--gov-teal)';
          return (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{p.reason}</span>
                <span style={{ fontSize: 11.5, fontWeight: 500, color }}>{pct}%</span>
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginBottom: 4, fontFamily: 'var(--font-devanagari)' }}>{p.reason_hi}</div>
              <div style={{ height: 5, background: 'var(--bg3)', borderRadius: 3 }}>
                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.5s ease' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
