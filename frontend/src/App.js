import React, { useState, useEffect } from 'react';
import './styles/global.css';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import FormPanel from './components/FormPanel';
import AIPanel from './components/AIPanel';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { servicesAPI, analyticsAPI } from './utils/api';

export default function App() {
  const { isOnline, networkType, isSimulatingOffline, setIsSimulatingOffline } = useNetworkStatus();
  const [currentService, setCurrentService] = useState('pension');
  const [services, setServices] = useState([]);
  const [rejectionPatterns, setRejectionPatterns] = useState({});
  const [dashboardStats, setDashboardStats] = useState({ todayApplications: 47, acceptanceRate: 91, errorsCaughtToday: 4 });
  const [formData, setFormData] = useState({});
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [riskScore, setRiskScore] = useState(42);
  const [applicationId, setApplicationId] = useState(null);
  const [aiMessages, setAiMessages] = useState([
    { id: 1, role: 'assistant', type: 'bubble', text: '👋 नमस्ते! I\'m your CSC AI Co-Pilot. I\'m monitoring this <strong>Old Age Pension</strong> application in real-time.', hindi: 'नमस्ते! मैं इस आवेदन की जांच कर रहा हूं।' },
    { id: 2, role: 'assistant', type: 'alert-warn', text: '⚠️ <strong>High-risk field:</strong> Age Proof document is missing. This causes 43% of pension rejections in Rajnandgaon.', hindi: 'आयु प्रमाण अनुपस्थित — 43% अस्वीकृति का कारण।' },
    { id: 3, role: 'assistant', type: 'alert-info', text: '💡 <strong>Tip:</strong> For applicants without birth certificate, School TC or Voter ID with DOB is accepted as age proof.', hindi: 'जन्म प्रमाण न हो तो स्कूल TC या मतदाता पहचान पत्र मान्य है।' },
  ]);

  // Load services and patterns
  useEffect(() => {
    if (isOnline) {
      servicesAPI.list().then(setServices).catch(() => {});
      analyticsAPI.rejectionPatterns().then(setRejectionPatterns).catch(() => {});
      analyticsAPI.dashboard().then(setDashboardStats).catch(() => {});
    }
  }, [isOnline]);

  // Update AI messages when service changes
  const handleServiceChange = (svc) => {
    setCurrentService(svc);
    setFormData({});
    setUploadedDocs([]);
    setRiskScore(20);
    setAiMessages(prev => [...prev, {
      id: Date.now(), role: 'assistant', type: 'alert-info',
      text: `Switched to <strong>${svc.charAt(0).toUpperCase() + svc.slice(1).replace('_', ' ')}</strong> — rejection patterns and eligibility rules updated.`,
      hindi: `${svc} सेवा के लिए जांच नियम अपडेट हुए।`
    }]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { fontSize: '12px' } }} />
      <Header
        isOnline={isOnline}
        networkType={networkType}
        isSimulatingOffline={isSimulatingOffline}
        onToggleOffline={() => setIsSimulatingOffline(v => !v)}
      />
      {!isOnline && (
        <div style={{ background: 'rgba(192,57,43,0.9)', color: '#fff', padding: '5px 16px', fontSize: '11.5px', textAlign: 'center' }}>
          ⚡ Offline mode — Edge-cached AI active · Core validations available · Cloud sync paused
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'var(--sidebar-width) 1fr var(--ai-panel-width)', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          currentService={currentService}
          onSelectService={handleServiceChange}
          dashboardStats={dashboardStats}
          rejectionPatterns={rejectionPatterns}
        />
        <FormPanel
          currentService={currentService}
          formData={formData}
          setFormData={setFormData}
          uploadedDocs={uploadedDocs}
          setUploadedDocs={setUploadedDocs}
          riskScore={riskScore}
          setRiskScore={setRiskScore}
          applicationId={applicationId}
          setApplicationId={setApplicationId}
          isOnline={isOnline}
          rejectionPatterns={rejectionPatterns}
          aiMessages={aiMessages}
          setAiMessages={setAiMessages}
        />
        <AIPanel
          isOnline={isOnline}
          currentService={currentService}
          formData={formData}
          uploadedDocs={uploadedDocs}
          riskScore={riskScore}
          applicationId={applicationId}
          messages={aiMessages}
          setMessages={setAiMessages}
          dashboardStats={dashboardStats}
        />
      </div>
    </div>
  );
}
