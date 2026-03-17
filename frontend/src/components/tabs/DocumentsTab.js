import React from 'react';

const SERVICE_DOCS = {
  pension: [
    { id: 'aadhaar', name: 'Aadhaar Card', nameHi: 'आधार कार्ड', required: true, riskNote: '' },
    { id: 'age_proof', name: 'Age Proof', nameHi: 'आयु प्रमाण', required: true, riskNote: '43% rejection', alternatives: ['Birth Certificate', 'School TC', 'Voter ID with DOB', 'Hospital Record'] },
    { id: 'bank_passbook', name: 'Bank Passbook (1st page)', nameHi: 'बैंक पासबुक (पहला पृष्ठ)', required: true, riskNote: '' },
    { id: 'income_cert', name: 'Income Certificate (< ₹1L/yr)', nameHi: 'आय प्रमाण (< ₹1 लाख)', required: true, riskNote: '' },
    { id: 'photo', name: 'Passport Photo', nameHi: 'पासपोर्ट फोटो', required: true, riskNote: '' },
  ],
  birth: [
    { id: 'hospital_cert', name: 'Hospital Birth Certificate', nameHi: 'अस्पताल जन्म प्रमाण', required: true, riskNote: '55% rejection' },
    { id: 'parents_aadhaar', name: "Parents' Aadhaar", nameHi: 'माता-पिता का आधार', required: true },
    { id: 'marriage_cert', name: 'Marriage Certificate', nameHi: 'विवाह प्रमाण पत्र', required: false },
  ],
  caste: [
    { id: 'aadhaar', name: 'Aadhaar Card', nameHi: 'आधार कार्ड', required: true },
    { id: 'parent_caste', name: "Parent's Caste Certificate", nameHi: 'माता/पिता का जाति प्रमाण', required: true, riskNote: '35% rejection' },
    { id: 'residence_proof', name: 'Residence Proof', nameHi: 'निवास प्रमाण', required: true },
  ],
  domicile: [
    { id: 'aadhaar', name: 'Aadhaar Card (CG address)', nameHi: 'आधार कार्ड (CG पता)', required: true },
    { id: 'voter_id', name: 'Voter ID', nameHi: 'मतदाता पहचान पत्र', required: false },
    { id: 'ration_card', name: 'Ration Card', nameHi: 'राशन कार्ड', required: false },
    { id: 'utility_bill', name: 'Utility Bill (2+ yrs old)', nameHi: 'बिल (2+ वर्ष पुराना)', required: false },
  ],
  income: [
    { id: 'aadhaar', name: 'Aadhaar Card', nameHi: 'आधार कार्ड', required: true },
    { id: 'income_source', name: 'Income Source Proof', nameHi: 'आय स्रोत प्रमाण', required: true, riskNote: '45% rejection' },
    { id: 'bank_stmt', name: 'Bank Statement (6 months)', nameHi: 'बैंक स्टेटमेंट (6 माह)', required: true, riskNote: '31% rejection' },
    { id: 'self_decl', name: 'Self Declaration (Notarised)', nameHi: 'स्व-घोषणा (नोटरीकृत)', required: true },
  ],
  land: [
    { id: 'aadhaar', name: 'Aadhaar Card', nameHi: 'आधार कार्ड', required: true },
    { id: 'khasra', name: 'Khasra/Khatauni Copy', nameHi: 'खसरा/खतौनी प्रति', required: true, riskNote: '38% rejection' },
    { id: 'registry', name: 'Registry/Sale Deed', nameHi: 'रजिस्ट्री/विक्रय पत्र', required: false },
  ],
};

export default function DocumentsTab({ serviceType, uploadedDocs, setUploadedDocs, setAiMessages }) {
  const docs = SERVICE_DOCS[serviceType] || SERVICE_DOCS.pension;
  const uploadedIds = uploadedDocs.map(d => d.id);

  const toggleDoc = (doc) => {
    if (uploadedIds.includes(doc.id)) {
      setUploadedDocs(prev => prev.filter(d => d.id !== doc.id));
    } else {
      setUploadedDocs(prev => [...prev, { id: doc.id, name: doc.name, uploadedAt: new Date().toISOString() }]);
      const msgs = { age_proof: { text: '✅ Age proof uploaded — removes the #1 pension rejection risk.', hindi: 'आयु प्रमाण अपलोड — सबसे बड़ा जोखिम दूर।' }, bank_passbook: { text: '✅ Bank passbook uploaded. Ensure IFSC and account number match the form.', hindi: 'पासबुक अपलोड — IFSC और खाता नं. मिलाएं।' }, income_cert: { text: '✅ Income certificate uploaded — verify amount is below ₹1 lakh/year.', hindi: 'आय प्रमाण अपलोड — ₹1 लाख से कम जांचें।' }, hospital_cert: { text: '✅ Hospital birth certificate uploaded — key document for birth applications.', hindi: 'अस्पताल प्रमाण अपलोड।' } };
      const msg = msgs[doc.id];
      if (msg) setAiMessages(prev => [...prev, { id: Date.now(), role: 'assistant', type: 'alert-ok', ...msg }]);
    }
  };

  const topRejectionDoc = docs.find(d => d.riskNote && d.required && !uploadedIds.includes(d.id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 10, padding: 14 }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-hint)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 12 }}>Required Documents / आवश्यक दस्तावेज़</div>
        {docs.map(doc => {
          const isUploaded = uploadedIds.includes(doc.id);
          return (
            <div key={doc.id} onClick={() => toggleDoc(doc)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', border: `0.5px solid ${isUploaded ? 'rgba(39,174,96,0.4)' : doc.required && !isUploaded ? 'rgba(192,57,43,0.2)' : 'var(--border)'}`, borderRadius: 8, marginBottom: 7, cursor: 'pointer', background: isUploaded ? 'rgba(39,174,96,0.04)' : 'transparent', transition: 'all 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background = isUploaded ? 'rgba(39,174,96,0.08)' : 'var(--bg2)'}
              onMouseLeave={e => e.currentTarget.style.background = isUploaded ? 'rgba(39,174,96,0.04)' : 'transparent'}>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 500, display: 'flex', gap: 6, alignItems: 'center' }}>
                  {doc.name}
                  {doc.required && <span style={{ fontSize: 9, padding: '1px 5px', background: 'rgba(192,57,43,0.08)', color: 'var(--gov-red)', borderRadius: 3, fontWeight: 600 }}>Required</span>}
                  {doc.riskNote && <span style={{ fontSize: 9, padding: '1px 5px', background: 'rgba(192,57,43,0.08)', color: 'var(--gov-red)', borderRadius: 3 }}>⚠ {doc.riskNote}</span>}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-devanagari)', marginTop: 2 }}>{doc.nameHi}</div>
                {doc.alternatives && !isUploaded && <div style={{ fontSize: 10, color: 'var(--text-hint)', marginTop: 2 }}>Accept: {doc.alternatives.join(' / ')}</div>}
              </div>
              <span style={{ fontSize: 11.5, padding: '3px 10px', borderRadius: 20, fontWeight: 500, background: isUploaded ? 'rgba(39,174,96,0.12)' : 'rgba(0,0,0,0.05)', color: isUploaded ? 'var(--gov-green)' : 'var(--text-hint)', whiteSpace: 'nowrap' }}>
                {isUploaded ? '✓ Uploaded' : '+ Upload'}
              </span>
            </div>
          );
        })}
      </div>

      {topRejectionDoc && (
        <div style={{ padding: '10px 12px', background: 'rgba(26,45,90,0.05)', borderRadius: 8, borderLeft: '3px solid var(--gov-navy)', fontSize: 12 }}>
          <strong style={{ color: 'var(--text)' }}>AI Alert:</strong> <strong>{topRejectionDoc.name}</strong> is missing — this is the top rejection cause for {serviceType} applications.
          {topRejectionDoc.alternatives && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Accepted alternatives: {topRejectionDoc.alternatives.join(', ')}</div>}
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: 'var(--font-devanagari)', marginTop: 4 }}>{topRejectionDoc.nameHi} अनुपस्थित — अस्वीकृति का मुख्य कारण।</div>
        </div>
      )}
    </div>
  );
}
