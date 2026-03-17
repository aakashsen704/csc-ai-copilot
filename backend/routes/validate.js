const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Verhoeff algorithm for Aadhaar checksum
const verhoeffTable = {
  d: [[0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],[3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],[6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],[9,8,7,6,5,4,3,2,1,0]],
  p: [[0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],[8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,6,8,7,0],[4,2,8,6,5,7,3,9,0,1],[2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8]],
  inv: [0,4,3,2,1,5,6,7,8,9]
};

function validateVerhoeff(num) {
  let c = 0;
  const digits = num.split('').reverse().map(Number);
  for (let i = 0; i < digits.length; i++) c = verhoeffTable.d[c][verhoeffTable.p[i % 8][digits[i]]];
  return c === 0;
}

// Validate Aadhaar
router.post('/aadhaar', (req, res) => {
  const { value } = req.body;
  const clean = (value || '').replace(/\s|-/g, '');
  if (!/^\d{12}$/.test(clean)) return res.json({ valid: false, error: 'Aadhaar must be exactly 12 digits', error_hi: 'आधार 12 अंकों का होना चाहिए' });
  if (['0', '1'].includes(clean[0])) return res.json({ valid: false, error: 'Aadhaar cannot start with 0 or 1', error_hi: 'आधार 0 या 1 से शुरू नहीं होता' });
  const checksumValid = validateVerhoeff(clean);
  if (!checksumValid) return res.json({ valid: false, warning: true, error: 'Aadhaar checksum may be invalid — verify the number', error_hi: 'आधार चेकसम संदिग्ध — नंबर जांचें' });
  res.json({ valid: true, formatted: `${clean.slice(0,4)} ${clean.slice(4,8)} ${clean.slice(8)}`, message: 'Valid Aadhaar format', message_hi: 'सही आधार प्रारूप' });
});

// Validate IFSC
router.post('/ifsc', (req, res) => {
  const { value } = req.body;
  const ifsc = (value || '').toUpperCase().trim();
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) return res.json({ valid: false, error: 'IFSC format: 4 letters + 0 + 6 alphanumeric (e.g. SBIN0001234)', error_hi: 'IFSC: 4 अक्षर + 0 + 6 वर्ण (उदा. SBIN0001234)' });
  const bankCodes = { SBIN: 'State Bank of India', PUNB: 'Punjab National Bank', UBIN: 'Union Bank', BKID: 'Bank of India', BARB: 'Bank of Baroda', CNRB: 'Canara Bank', CBIN: 'Central Bank', IOBA: 'IOB', MAHB: 'Bank of Maharashtra', KVBL: 'Karur Vysya Bank' };
  const bank = bankCodes[ifsc.slice(0, 4)] || 'Unknown bank';
  res.json({ valid: true, bank, branch_code: ifsc.slice(5), message: `Valid IFSC (${bank})`, message_hi: `सही IFSC (${bank})` });
});

// Validate mobile
router.post('/mobile', (req, res) => {
  const { value } = req.body;
  const mobile = (value || '').replace(/\D/g, '');
  if (mobile.length !== 10) return res.json({ valid: false, error: 'Mobile must be exactly 10 digits', error_hi: 'मोबाइल 10 अंकों का होना चाहिए' });
  if (!/^[6-9]/.test(mobile)) return res.json({ valid: false, error: 'Mobile must start with 6, 7, 8, or 9', error_hi: 'मोबाइल 6, 7, 8 या 9 से शुरू होना चाहिए' });
  res.json({ valid: true, message: 'Valid mobile number', message_hi: 'सही मोबाइल नंबर' });
});

// Validate age for service
router.post('/age', (req, res) => {
  const { dob, serviceType } = req.body;
  if (!dob) return res.json({ valid: false, error: 'Date of birth required', error_hi: 'जन्म तिथि आवश्यक' });
  const age = Math.floor((new Date() - new Date(dob)) / (365.25 * 24 * 3600 * 1000));
  const rules = { pension: { min: 60, label: 'Old Age Pension' }, birth: { max: 0, label: 'Birth Certificate' } };
  const rule = rules[serviceType];
  if (serviceType === 'pension') {
    if (age < 60) return res.json({ valid: false, age, error: `Age ${age} — minimum 60 required for pension`, error_hi: `आयु ${age} वर्ष — पेंशन के लिए न्यूनतम 60 वर्ष` });
    return res.json({ valid: true, age, message: `Age ${age} — eligible for pension`, message_hi: `आयु ${age} वर्ष — पेंशन के लिए पात्र` });
  }
  res.json({ valid: true, age, message: `Age: ${age} years`, message_hi: `आयु: ${age} वर्ष` });
});

// Validate pincode for Rajnandgaon
router.post('/pincode', (req, res) => {
  const { value } = req.body;
  if (!/^\d{6}$/.test(value)) return res.json({ valid: false, error: 'Pincode must be 6 digits', error_hi: 'पिनकोड 6 अंकों का होना चाहिए' });
  const pin = parseInt(value);
  if (pin >= 491441 && pin <= 491559) return res.json({ valid: true, district: 'Rajnandgaon', state: 'Chhattisgarh', message: 'Rajnandgaon district pincode', message_hi: 'राजनांदगांव जिला पिनकोड' });
  if (value.startsWith('49')) return res.json({ valid: true, warning: true, district: 'Chhattisgarh', message: 'Chhattisgarh pincode — verify district', message_hi: 'छत्तीसगढ़ पिनकोड — जिला जांचें' });
  res.json({ valid: false, warning: true, error: 'Pincode not in Rajnandgaon district (491xxx)', error_hi: 'राजनांदगांव जिले का पिनकोड नहीं (491xxx)' });
});

// Full form validation
router.post('/form', (req, res) => {
  const { formData, serviceType } = req.body;
  const errors = [];
  const warnings = [];

  if (formData.aadhaar) {
    const clean = formData.aadhaar.replace(/\s/g, '');
    if (!/^\d{12}$/.test(clean)) errors.push({ field: 'aadhaar', message: 'Invalid Aadhaar format', message_hi: 'आधार प्रारूप गलत' });
  } else errors.push({ field: 'aadhaar', message: 'Aadhaar is required', message_hi: 'आधार आवश्यक है' });

  if (formData.mobile && !/^[6-9]\d{9}$/.test(formData.mobile))
    errors.push({ field: 'mobile', message: 'Invalid mobile number', message_hi: 'मोबाइल नंबर गलत' });

  if (formData.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode.toUpperCase()))
    errors.push({ field: 'ifscCode', message: 'Invalid IFSC code', message_hi: 'IFSC कोड गलत' });

  if (serviceType === 'pension' && formData.dob) {
    const age = Math.floor((new Date() - new Date(formData.dob)) / (365.25 * 24 * 3600 * 1000));
    if (age < 60) errors.push({ field: 'dob', message: `Age ${age} — must be ≥ 60 for pension`, message_hi: `आयु ${age} — पेंशन के लिए 60+ आवश्यक` });
  }

  if (formData.pincode && !/^49\d{4}$/.test(formData.pincode))
    warnings.push({ field: 'pincode', message: 'Pincode may not be in Rajnandgaon district', message_hi: 'पिनकोड जिले से बाहर हो सकता है' });

  // Estimate risk
  let riskScore = 20;
  riskScore += errors.length * 18;
  riskScore += warnings.length * 8;
  riskScore = Math.min(95, riskScore);

  res.json({ valid: errors.length === 0, errors, warnings, riskScore, riskLevel: riskScore < 30 ? 'low' : riskScore < 60 ? 'medium' : 'high' });
});

module.exports = router;
