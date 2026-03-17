import React, { useState, useRef, useEffect } from 'react';
import { aiAPI } from '../utils/api';
import { getOfflineResponse } from '../utils/validators';

function RiskMeter({ score }) {
  const level = score < 30 ? 'low' : score < 60 ? 'medium' : 'high';
  const color = { low: 'var(--gov-green)', medium: 'var(--gov-amber)', high: 'var(--gov-red)' }[level];
  const label = { low: 'Low Risk', medium: 'Medium Risk', high: 'High Risk' }[level];
  return (
    <div style={{ padding: '12px 14px', borderBottom: '0.5px solid var(--border)' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 500 }}>Rejection Risk / अस्वीकृति जोखिम</div>
      <div style={{ height: 8, background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 4, transition: 'all 0.5s ease' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
        <span style={{ fontSize: 12.5, fontWeight: 500, color }}>{label} ({score}%)</span>
        <span style={{ fontSize: 10.5, color: 'var(--text-hint)' }}>Based on district data</span>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', background: 'var(--bg2)', borderRadius: 10, border: '0.5px solid var(--border)', width: 'fit-content' }}>
      {[0, 0.15, 0.3].map((delay, i) => (
        <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--text-hint)', display: 'inline-block', animation: `bounce 1.2s infinite ${delay}s` }} />
      ))}
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === 'user';
  if (isUser) return (
    <div style={{ alignSelf: 'flex-end', maxWidth: '90%' }}>
      <div style={{ padding: '8px 12px', background: 'var(--gov-navy)', color: '#fff', borderRadius: '10px 10px 3px 10px', fontSize: 12.5, lineHeight: 1.55 }}>{msg.text}</div>
      <div style={{ fontSize: 10, color: 'var(--text-hint)', textAlign: 'right', marginTop: 2 }}>{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
    </div>
  );

  const alertStyles = {
    'alert-error': { bg: 'rgba(192,57,43,0.07)', border: 'var(--gov-red)' },
    'alert-warn': { bg: 'rgba(230,126,34,0.07)', border: 'var(--gov-amber)' },
    'alert-ok': { bg: 'rgba(39,174,96,0.07)', border: 'var(--gov-green)' },
    'alert-info': { bg: 'rgba(26,45,90,0.06)', border: 'var(--gov-navy)' },
    bubble: { bg: 'var(--bg2)', border: 'var(--border)' },
  };
  const style = alertStyles[msg.type] || alertStyles.bubble;

  return (
    <div className="fade-in" style={{ maxWidth: '100%' }}>
      <div style={{ padding: '9px 12px', background: style.bg, border: `0.5px solid ${style.border}`, borderLeft: msg.type !== 'bubble' ? `3px solid ${style.border}` : `0.5px solid ${style.border}`, borderRadius: 10, fontSize: 12.5, lineHeight: 1.55 }}
        dangerouslySetInnerHTML={{ __html: msg.text }} />
      {msg.hindi && <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 3, fontFamily: 'var(--font-devanagari)', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: msg.hindi }} />}
    </div>
  );
}

export default function AIPanel({ isOnline, currentService, formData, uploadedDocs, riskScore, applicationId, messages, setMessages, dashboardStats }) {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg) return;
    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', type: 'user', text: msg }]);
    setIsTyping(true);

    if (!isOnline) {
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', type: 'bubble', text: getOfflineResponse(msg) }]);
      }, 600);
      return;
    }

    try {
      const history = [...conversationHistory, { role: 'user', content: msg }];
      const res = await aiAPI.chat(msg, { applicationId, serviceType: currentService, formData: { ...formData, riskScore, uploadedDocs: uploadedDocs.map(d => d.id) }, conversationHistory: history });
      setConversationHistory([...history, { role: 'assistant', content: res.reply }]);
      setIsTyping(false);
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', type: 'bubble', text: res.reply.replace(/\n/g, '<br>') }]);
    } catch {
      setIsTyping(false);
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', type: 'alert-warn', text: '⚠ Could not reach AI server. Check connection. Local validations still active.', hindi: 'AI सर्वर से संपर्क नहीं। स्थानीय जांच सक्रिय।' }]);
    }
  };

  const toggleMic = () => {
    if (micActive) { setMicActive(false); return; }
    setMicActive(true);
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SR();
      recognition.lang = 'hi-IN';
      recognition.interimResults = false;
      recognition.onresult = (e) => { const transcript = e.results[0][0].transcript; setInput(transcript); setMicActive(false); };
      recognition.onerror = () => setMicActive(false);
      recognition.onend = () => setMicActive(false);
      recognition.start();
    } else {
      setTimeout(() => { setInput('आयु प्रमाण के लिए कौन से दस्तावेज़ मान्य हैं?'); setMicActive(false); }, 2000);
    }
  };

  const quickQuestions = ['What docs for age proof?', 'IFSC format?', 'Pension eligibility rules?', 'Top rejection causes?'];

  return (
    <aside style={{ background: 'var(--bg)', borderLeft: '0.5px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <RiskMeter score={riskScore} />

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, padding: '10px 12px', borderBottom: '0.5px solid var(--border)' }}>
        {[
          { val: riskScore > 60 ? '⚠ High' : riskScore > 30 ? '~Med' : '✓ Low', label: 'Risk level' },
          { val: `~${Math.floor(riskScore / 10)} min`, label: 'Est. time saved' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg2)', borderRadius: 7, padding: '7px 10px' }}>
            <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>{s.val}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* AI header */}
      <div style={{ padding: '10px 14px', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg, var(--gov-navy), var(--gov-teal))', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', fontWeight: 700, flexShrink: 0 }}>AI</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>AI Assistant</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-devanagari)' }}>हिंदी में सहायता उपलब्ध</div>
        </div>
        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: isOnline ? 'rgba(39,174,96,0.1)' : 'rgba(192,57,43,0.1)', color: isOnline ? 'var(--gov-green)' : 'var(--gov-red)', fontWeight: 500 }}>
          {isOnline ? 'Online' : 'Edge AI'}
        </span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map(msg => <Message key={msg.id} msg={msg} />)}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick questions */}
      <div style={{ padding: '6px 10px', borderTop: '0.5px solid var(--border)', display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {quickQuestions.map(q => (
          <button key={q} onClick={() => sendMessage(q)} style={{ fontSize: 10.5, padding: '3px 8px', border: '0.5px solid var(--border)', borderRadius: 20, background: 'var(--bg2)', color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.1s', whiteSpace: 'nowrap' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg2)'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
            {q}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div style={{ padding: '8px 10px', borderTop: '0.5px solid var(--border)', display: 'flex', gap: 6, alignItems: 'flex-end' }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="Ask anything / फॉर्म के बारे में पूछें..."
          rows={1}
          style={{ flex: 1, border: '0.5px solid var(--border)', borderRadius: 8, padding: '7px 10px', fontSize: 12.5, fontFamily: 'var(--font-sans)', background: 'var(--bg2)', color: 'var(--text)', outline: 'none', resize: 'none', height: 36, transition: 'border-color 0.12s' }}
          onFocus={e => e.target.style.borderColor = 'var(--gov-orange)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        <button onClick={toggleMic} title="Voice input (Hindi/English)" style={{ width: 34, height: 34, borderRadius: 8, border: '0.5px solid var(--border)', background: micActive ? 'rgba(232,119,34,0.1)' : 'var(--bg2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: micActive ? 'var(--gov-orange)' : 'var(--text-muted)', animation: micActive ? 'pulse 1.2s infinite' : 'none', transition: 'all 0.12s' }}>🎙</button>
        <button onClick={() => sendMessage()} style={{ width: 34, height: 34, borderRadius: 8, border: 'none', background: 'var(--gov-navy)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, transition: 'background 0.12s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--gov-orange)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--gov-navy)'}>➤</button>
      </div>
    </aside>
  );
}
