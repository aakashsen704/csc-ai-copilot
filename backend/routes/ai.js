const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const db = require('../db/database');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert AI Co-Pilot for CSC (Common Service Centre) operators in Rajnandgaon district, Chhattisgarh, India.

Your purpose: Help operators fill government forms correctly, reduce rejections, work efficiently.

ALWAYS:
1. Respond in BOTH English AND Hindi (Devanagari). Format: English answer, then "—", then Hindi.
2. Be EXTREMELY concise — operators process 70-90 applications/day. Max 80 words total.
3. Be action-oriented: tell them exactly what to do.

KEY RULES:
OLD AGE PENSION (Form 7A): Age ≥ 60, CG resident 15+ years, income < ₹1L/year, no other govt pension. Required: Aadhaar, Age proof, Bank passbook (DBT), Income cert, Photo. Top rejections: Age proof missing (43%), Wrong IFSC (28%), DOB mismatch (19%).
BIRTH CERT (Form 4B): Apply within 21 days. Required: Hospital birth record, Parents' Aadhaar.
CASTE CERT (Form 6C): Different forms for SC/ST/OBC — never mix. Required: Parent caste cert/revenue record.
DOMICILE: 15+ years CG residence. Required: Aadhaar (CG address), voter ID, ration card.
INCOME: Required: Income source proof, bank statement (6 months), notarised self-declaration.

VALIDATION:
- Aadhaar: 12 digits, not starting 0 or 1
- IFSC: 4 uppercase letters + '0' + 6 alphanumeric (e.g. SBIN0001234)
- Mobile: 10 digits, starts 6/7/8/9
- Age proof: Birth cert, School TC, Voter ID with DOB, hospital record, Aadhaar (if DOB shown)
- Rajnandgaon pincodes: 491441–491559`;

router.post('/chat', async (req, res) => {
  try {
    const { message, applicationId, serviceType, formData, conversationHistory = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
      return res.status(503).json({ error: 'API key not configured', reply: 'AI chat requires ANTHROPIC_API_KEY. Set it in backend/.env — आधार: ANTHROPIC_API_KEY बैकएंड .env में सेट करें।' });
    }

    const contextStr = formData ? `Current: service=${serviceType}, riskScore=${formData.riskScore}%, name=${formData.fullName||'?'}, aadhaar=${formData.aadhaar?'provided':'missing'}, dob=${formData.dob||'missing'}, ifsc=${formData.ifscCode||'missing'}` : '';
    const messages = [
      ...conversationHistory.slice(-6).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: `${contextStr}\nQuery: ${message}` }
    ];

    const response = await client.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 350, system: SYSTEM_PROMPT, messages });
    const reply = response.content[0].text;

    if (applicationId) {
      db.addConversation({ application_id: applicationId, role: 'user', content: message });
      db.addConversation({ application_id: applicationId, role: 'assistant', content: reply });
    }
    res.json({ reply });
  } catch (err) {
    console.error('AI error:', err.message);
    res.status(500).json({ error: 'AI service error', message: err.message });
  }
});

router.post('/analyze', async (req, res) => {
  try {
    const { serviceType, formData, documents } = req.body;
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
      return res.json({ riskScore: 40, riskLevel: 'medium', criticalIssues: [], suggestions: [] });
    }
    const patterns = db.getRejectionPatterns(serviceType || 'pension');
    const prompt = `Analyze this ${serviceType} form for rejection risk. Data: ${JSON.stringify(formData)}. Docs: ${JSON.stringify(documents||[])}. Known patterns: ${JSON.stringify(patterns.map(p=>({reason:p.reason,pct:p.percentage})))}. Return JSON only: {"riskScore":0-100,"riskLevel":"low|medium|high","criticalIssues":[{"field":"","issue":"","issue_hi":"","severity":"critical|warning"}],"suggestions":[{"en":"","hi":""}]}`;
    const response = await client.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 500, messages: [{ role: 'user', content: prompt }] });
    let analysis;
    try { analysis = JSON.parse(response.content[0].text.replace(/```json\n?|```/g, '').trim()); } catch { analysis = { riskScore: 40, riskLevel: 'medium', criticalIssues: [], suggestions: [] }; }
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
