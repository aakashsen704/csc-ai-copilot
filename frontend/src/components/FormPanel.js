import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import PersonalTab from './tabs/PersonalTab';
import AddressTab from './tabs/AddressTab';
import DocumentsTab from './tabs/DocumentsTab';
import EligibilityTab from './tabs/EligibilityTab';
import { validateAPI, appAPI } from '../utils/api';
import { calculateRiskScore } from '../utils/validators';

const TABS = [
  { id: 'personal', label: 'Personal', labelHi: 'व्यक्तिगत' },
  { id: 'address', label: 'Address', labelHi: 'पता' },
  { id: 'documents', label: 'Documents', labelHi: 'दस्तावेज़' },
  { id: 'eligibility', label: 'Eligibility', labelHi: 'पात्रता' },
];

const SERVICE_INFO = {
  pension: { title: 'Old Age Pension — New Application', titleHi: 'वृद्धावस्था पेंशन — नया आवेदन', form: '7A', reject: 31 },
  birth: { title: 'Birth Certificate — New Application', titleHi: 'जन्म प्रमाण पत्र — नया आवेदन', form: '4B', reject: 8 },
  caste: { title: 'Caste Certificate — New Application', titleHi: 'जाति प्रमाण पत्र — नया आवेदन', form: '6C', reject: 18 },
  domicile: { title: 'Domicile Certificate — New Application', titleHi: 'निवास प्रमाण पत्र — नया आवेदन', form: '5A', reject: 15 },
  income: { title: 'Income Certificate — New Application', titleHi: 'आय प्रमाण पत्र — नया आवेदन', form: '3D', reject: 11 },
  land: { title: 'Land Record (B1) — New Application', titleHi: 'भूमि रिकॉर्ड बी-१ — नया आवेदन', form: 'B1', reject: 26 },
};

export default function FormPanel({ currentService, formData, setFormData, uploadedDocs, setUploadedDocs, riskScore, setRiskScore, applicationId, setApplicationId, isOnline, rejectionPatterns, setAiMessages }) {
  const [activeTab, setActiveTab] = useState('personal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const svcInfo = SERVICE_INFO[currentService] || SERVICE_INFO.pension;

  // Tab progress
  const tabProgress = { personal: 60, address: 35, documents: 75, eligibility: 50 };
  const progress = tabProgress[activeTab] || 50;

  // Recalculate risk on form/doc changes
  useEffect(() => {
    const { riskScore: score } = calculateRiskScore(formData, currentService, uploadedDocs);
    setRiskScore(score);
  }, [formData, uploadedDocs, currentService, setRiskScore]);

  const handleField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const runPreCheck = async () => {
    const toastId = toast.loading('Running pre-submission check...');
    try {
      let result;
      if (isOnline) {
        result = await validateAPI.form(formData, currentService);
      } else {
        const { riskScore: score, issues } = calculateRiskScore(formData, currentService, uploadedDocs);
        result = { valid: issues.length === 0, errors: issues.map(i => ({ field: i.field, message: `${i.field} has an issue` })), warnings: [], riskScore: score };
      }
      toast.dismiss(toastId);
      if (result.valid && result.errors?.length === 0) {
        toast.success('Pre-check passed! All fields look good.');
        setAiMessages(prev => [...prev, { id: Date.now(), role: 'assistant', type: 'alert-ok', text: '✅ Pre-check passed! All filled fields are valid. Ensure all required documents are uploaded.', hindi: 'प्री-जांच सफल! सभी फील्ड सही हैं।' }]);
      } else {
        const errList = (result.errors || []).map(e => `• ${e.message}`).join('<br>');
        toast.error(`Found ${(result.errors||[]).length} issue(s)`);
        setAiMessages(prev => [...prev, { id: Date.now(), role: 'assistant', type: 'alert-error', text: `⛔ Found ${(result.errors||[]).length} issue(s):<br>${errList}`, hindi: `${(result.errors||[]).length} समस्याएं मिलीं।` }]);
      }
    } catch (err) {
      toast.dismiss(toastId);
      toast.error('Validation check failed');
    }
  };

  const handleSubmit = async () => {
    if (riskScore > 65) {
      toast.error(`Rejection risk too high (${riskScore}%). Fix issues first.`);
      setAiMessages(prev => [...prev, { id: Date.now(), role: 'assistant', type: 'alert-error', text: `⛔ Submission blocked. Risk score ${riskScore}% — resolve flagged issues first.`, hindi: `${riskScore}% जोखिम — पहले समस्याएं ठीक करें।` }]);
      return;
    }
    setIsSubmitting(true);
    const toastId = toast.loading('Submitting application...');
    try {
      let refNumber;
      if (isOnline) {
        let appId = applicationId;
        if (!appId) {
          const created = await appAPI.create(currentService, formData);
          appId = created.id;
          setApplicationId(appId);
        }
        const result = await appAPI.submit(appId);
        refNumber = result.referenceNumber;
      } else {
        refNumber = `CSC-${Date.now().toString().slice(-6)}`;
      }
      toast.dismiss(toastId);
      toast.success(`Application submitted! Ref: ${refNumber}`);
      setAiMessages(prev => [...prev, { id: Date.now(), role: 'assistant', type: 'alert-ok', text: `✅ Application submitted! Reference: <strong>${refNumber}</strong>. Estimated processing: 7–10 working days.`, hindi: `आवेदन जमा हुआ। संदर्भ नं: ${refNumber}` }]);
      setFormData({});
      setUploadedDocs([]);
      setRiskScore(20);
    } catch (err) {
      toast.dismiss(toastId);
      toast.error('Submission failed. Try again.');
    }
    setIsSubmitting(false);
  };

  const rejectColor = svcInfo.reject > 20 ? '#c0392b' : svcInfo.reject > 12 ? '#b36000' : '#1e8449';
  const rejectBg = svcInfo.reject > 20 ? 'rgba(192,57,43,0.08)' : svcInfo.reject > 12 ? 'rgba(230,126,34,0.08)' : 'rgba(39,174,96,0.08)';

  return (
    <main style={{ overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Panel header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{svcInfo.title}</h1>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-devanagari)', marginTop: 2 }}>{svcInfo.titleHi}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', padding: '3px 8px', background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 5 }}>Form #{svcInfo.form}</span>
          <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 5, background: rejectBg, color: rejectColor }}>{svcInfo.reject}% rejection rate</span>
        </div>
      </div>

      {/* Progress */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Form completion</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{progress}%</span>
        </div>
        <div style={{ height: 3, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'var(--gov-orange)', borderRadius: 2, transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '0.5px solid var(--border)' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '8px 14px', fontSize: 12.5, border: 'none', background: 'transparent',
            color: activeTab === tab.id ? 'var(--gov-orange)' : 'var(--text-muted)',
            borderBottom: activeTab === tab.id ? '2px solid var(--gov-orange)' : '2px solid transparent',
            cursor: 'pointer', fontWeight: activeTab === tab.id ? 500 : 400,
            transition: 'all 0.12s', fontFamily: 'var(--font-sans)'
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="fade-in" key={activeTab}>
        {activeTab === 'personal' && <PersonalTab formData={formData} onChange={handleField} serviceType={currentService} isOnline={isOnline} setAiMessages={setAiMessages} />}
        {activeTab === 'address' && <AddressTab formData={formData} onChange={handleField} serviceType={currentService} isOnline={isOnline} />}
        {activeTab === 'documents' && <DocumentsTab serviceType={currentService} uploadedDocs={uploadedDocs} setUploadedDocs={setUploadedDocs} setAiMessages={setAiMessages} rejectionPatterns={rejectionPatterns} />}
        {activeTab === 'eligibility' && <EligibilityTab formData={formData} serviceType={currentService} uploadedDocs={uploadedDocs} isOnline={isOnline} rejectionPatterns={rejectionPatterns} />}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button onClick={runPreCheck} style={{ padding: '9px 16px', fontSize: 12.5, border: '0.5px solid var(--border)', borderRadius: 8, background: 'var(--bg2)', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'background 0.12s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--bg2)'}>
          🔍 Pre-check / जांचें
        </button>
        <button onClick={handleSubmit} disabled={isSubmitting} style={{ flex: 1, padding: '9px 16px', fontSize: 12.5, fontWeight: 500, border: 'none', borderRadius: 8, background: isSubmitting ? 'var(--text-hint)' : 'var(--gov-navy)', color: '#fff', cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: 'background 0.12s' }}
          onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.background = 'var(--gov-orange)'; }}
          onMouseLeave={e => { if (!isSubmitting) e.currentTarget.style.background = 'var(--gov-navy)'; }}>
          {isSubmitting ? 'Submitting...' : 'Submit Application / आवेदन जमा करें →'}
        </button>
      </div>
    </main>
  );
}
