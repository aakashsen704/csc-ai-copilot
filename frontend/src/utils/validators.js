// Edge-cached validators — work fully offline

export function validateAadhaarOffline(value) {
  const clean = (value || '').replace(/\s|-/g, '');
  if (!/^\d{12}$/.test(clean)) return { valid: false, error: 'Aadhaar must be 12 digits', error_hi: 'आधार 12 अंकों का होना चाहिए' };
  if (['0', '1'].includes(clean[0])) return { valid: false, error: 'Cannot start with 0 or 1', error_hi: '0 या 1 से शुरू नहीं होता' };
  return { valid: true, formatted: `${clean.slice(0,4)} ${clean.slice(4,8)} ${clean.slice(8)}`, message: 'Valid Aadhaar', message_hi: 'सही आधार' };
}

export function validateIFSCOffline(value) {
  const ifsc = (value || '').toUpperCase().trim();
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) return { valid: false, error: 'Format: 4 letters + 0 + 6 chars (SBIN0001234)', error_hi: 'प्रारूप: 4 अक्षर + 0 + 6 वर्ण' };
  const banks = { SBIN: 'SBI', PUNB: 'PNB', UBIN: 'Union Bank', BKID: 'Bank of India', BARB: 'Bank of Baroda', CNRB: 'Canara Bank' };
  const bank = banks[ifsc.slice(0,4)] || ifsc.slice(0,4);
  return { valid: true, bank, message: `Valid IFSC (${bank})`, message_hi: `सही IFSC (${bank})` };
}

export function validateMobileOffline(value) {
  const mobile = (value || '').replace(/\D/g, '');
  if (mobile.length !== 10) return { valid: false, error: 'Must be 10 digits', error_hi: '10 अंक होने चाहिए' };
  if (!/^[6-9]/.test(mobile)) return { valid: false, error: 'Must start with 6-9', error_hi: '6-9 से शुरू होना चाहिए' };
  return { valid: true, message: 'Valid mobile', message_hi: 'सही मोबाइल' };
}

export function validateAgeOffline(dob, serviceType) {
  if (!dob) return { valid: false, error: 'DOB required', error_hi: 'जन्म तिथि आवश्यक' };
  const age = Math.floor((Date.now() - new Date(dob)) / (365.25 * 24 * 3600 * 1000));
  if (serviceType === 'pension' && age < 60) return { valid: false, age, error: `Age ${age} — need 60+ for pension`, error_hi: `आयु ${age} — पेंशन के लिए 60+ चाहिए` };
  return { valid: true, age, message: `Age: ${age}`, message_hi: `आयु: ${age} वर्ष` };
}

export function validatePincodeOffline(value) {
  if (!/^\d{6}$/.test(value)) return { valid: false, error: '6 digits required', error_hi: '6 अंक आवश्यक' };
  const pin = parseInt(value);
  if (pin >= 491441 && pin <= 491559) return { valid: true, district: 'Rajnandgaon', message: 'Rajnandgaon district', message_hi: 'राजनांदगांव जिला' };
  if (value.startsWith('49')) return { valid: true, warning: true, message: 'CG pincode — verify district', message_hi: 'CG पिनकोड — जिला जांचें' };
  return { valid: false, warning: true, error: 'Not Rajnandgaon district', error_hi: 'राजनांदगांव जिले का नहीं' };
}

export function calculateRiskScore(formData, serviceType, documents = []) {
  let score = 20;
  const issues = [];

  if (!formData.aadhaar || formData.aadhaar.replace(/\s/g,'').length !== 12) { score += 10; issues.push({ field: 'aadhaar', severity: 'error' }); }
  if (!formData.dob) { score += 8; }
  if (serviceType === 'pension' && formData.dob) {
    const age = Math.floor((Date.now() - new Date(formData.dob)) / (365.25 * 24 * 3600 * 1000));
    if (age < 60) { score += 30; issues.push({ field: 'age', severity: 'critical' }); }
  }
  if (formData.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode.toUpperCase())) { score += 15; issues.push({ field: 'ifsc', severity: 'error' }); }
  if (formData.mobile && !/^[6-9]\d{9}$/.test(formData.mobile)) { score += 8; issues.push({ field: 'mobile', severity: 'warning' }); }

  // Service-specific doc checks
  const docMap = { pension: ['age_proof', 'bank_passbook', 'income_cert'], birth: ['hospital_cert'], caste: ['parent_caste'], domicile: ['residence_proof'], income: ['income_source', 'bank_stmt'], land: ['khasra'] };
  const required = docMap[serviceType] || [];
  const uploadedIds = documents.map(d => d.id);
  required.forEach(docId => { if (!uploadedIds.includes(docId)) { score += 12; issues.push({ field: docId, severity: 'critical' }); } });

  return { riskScore: Math.min(95, score), riskLevel: score < 30 ? 'low' : score < 60 ? 'medium' : 'high', issues };
}

// Offline AI responses cache
export const OFFLINE_RESPONSES = {
  age_proof: 'Age proof alternatives: Birth certificate, School TC, Voter ID (with DOB), hospital record. — आयु प्रमाण विकल्प: जन्म प्रमाण, स्कूल TC, मतदाता पहचान (DOB सहित), अस्पताल रिकॉर्ड।',
  ifsc: 'IFSC format: 4 letters + "0" + 6 alphanumeric. Example: SBIN0001234 (SBI). — IFSC: 4 अक्षर + 0 + 6 वर्ण। उदाहरण: SBIN0001234',
  aadhaar: 'Aadhaar must be 12 digits, cannot start with 0 or 1. Spaces are acceptable. — आधार 12 अंकों का, 0 या 1 से शुरू न हो।',
  pension: 'Pension eligibility: Age ≥ 60, CG resident 15+ years, income < ₹1L/year, no other govt pension. — पात्रता: आयु 60+, 15 वर्ष निवास, आय ₹1 लाख से कम।',
  document: 'Pension docs: Aadhaar, Age proof, Bank passbook (DBT), Income cert, Photo. — पेंशन दस्तावेज़: आधार, आयु प्रमाण, बैंक पासबुक, आय प्रमाण, फोटो।',
  reject: 'Top rejections pension: 1) Age proof missing 43% 2) Wrong IFSC 28% 3) DOB mismatch 19%. — मुख्य कारण: आयु प्रमाण 43%, गलत IFSC 28%, जन्म तिथि 19%।',
};

export function getOfflineResponse(query) {
  const q = query.toLowerCase();
  for (const [key, response] of Object.entries(OFFLINE_RESPONSES)) {
    if (q.includes(key)) return response;
  }
  return 'Offline mode — core validations active. For detailed guidance, reconnect to internet. — ऑफलाइन मोड — मुख्य जांच सक्रिय है।';
}
