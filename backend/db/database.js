const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'db.json');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

let db;

async function initDB() {
  const adapter = new JSONFile(DB_PATH);
  db = new Low(adapter, { applications: [], ai_conversations: [], rejection_patterns: [] });
  await db.read();
  db.data.applications = db.data.applications || [];
  db.data.ai_conversations = db.data.ai_conversations || [];
  db.data.rejection_patterns = db.data.rejection_patterns || [];

  if (db.data.rejection_patterns.length === 0) {
    db.data.rejection_patterns = [
      { id:1,  service_type:'pension',  field_name:'age_proof',      reason:'Age proof document missing',          reason_hi:'आयु प्रमाण दस्तावेज़ अनुपस्थित',  frequency:364, percentage:43 },
      { id:2,  service_type:'pension',  field_name:'ifsc_code',       reason:'Incorrect IFSC code',                  reason_hi:'गलत IFSC कोड',                      frequency:237, percentage:28 },
      { id:3,  service_type:'pension',  field_name:'dob_mismatch',    reason:'DOB mismatch across documents',        reason_hi:'जन्म तिथि दस्तावेज़ों में भिन्न',   frequency:161, percentage:19 },
      { id:4,  service_type:'pension',  field_name:'income_limit',    reason:'Income exceeds ₹1 lakh limit',        reason_hi:'आय ₹1 लाख सीमा से अधिक',          frequency:85,  percentage:10 },
      { id:5,  service_type:'birth',    field_name:'hospital_cert',   reason:'Hospital birth certificate missing',   reason_hi:'अस्पताल जन्म प्रमाण पत्र नहीं',   frequency:275, percentage:55 },
      { id:6,  service_type:'birth',    field_name:'name_mismatch',   reason:'Father/mother name mismatch',          reason_hi:'माता/पिता का नाम मेल नहीं',        frequency:125, percentage:25 },
      { id:7,  service_type:'birth',    field_name:'late_application',reason:'Application filed after 21 days',      reason_hi:'21 दिन बाद आवेदन',                 frequency:100, percentage:20 },
      { id:8,  service_type:'caste',    field_name:'wrong_form',      reason:'Wrong form submitted for category',    reason_hi:'गलत फॉर्म जमा किया',               frequency:190, percentage:38 },
      { id:9,  service_type:'caste',    field_name:'caste_proof',     reason:'Supporting caste document missing',    reason_hi:'जाति दस्तावेज़ अनुपस्थित',         frequency:175, percentage:35 },
      { id:10, service_type:'caste',    field_name:'tahsildar',       reason:'Tahsildar verification pending',       reason_hi:'तहसीलदार सत्यापन लंबित',           frequency:135, percentage:27 },
      { id:11, service_type:'domicile', field_name:'residency_proof', reason:'Residency proof insufficient',         reason_hi:'निवास प्रमाण अपर्याप्त',           frequency:210, percentage:42 },
      { id:12, service_type:'domicile', field_name:'aadhaar_address', reason:'Aadhaar address does not match',       reason_hi:'आधार पता मेल नहीं',                frequency:175, percentage:35 },
      { id:13, service_type:'domicile', field_name:'years_residency', reason:'Less than 15 years residency',         reason_hi:'15 वर्ष से कम निवास',              frequency:115, percentage:23 },
      { id:14, service_type:'income',   field_name:'income_source',   reason:'Income source proof not provided',     reason_hi:'आय स्रोत प्रमाण नहीं',            frequency:189, percentage:45 },
      { id:15, service_type:'income',   field_name:'bank_statement',  reason:'Bank statement missing',               reason_hi:'बैंक स्टेटमेंट नहीं',             frequency:130, percentage:31 },
      { id:16, service_type:'income',   field_name:'self_declaration',reason:'Self-declaration not notarised',       reason_hi:'स्व-घोषणा नोटरीकृत नहीं',         frequency:101, percentage:24 },
      { id:17, service_type:'land',     field_name:'khasra_mismatch', reason:'Khasra number mismatch',               reason_hi:'खसरा नंबर मेल नहीं',               frequency:156, percentage:38 },
      { id:18, service_type:'land',     field_name:'survey_outdated', reason:'Outdated survey number',               reason_hi:'पुराना सर्वे नंबर',                frequency:123, percentage:30 },
      { id:19, service_type:'land',     field_name:'owner_name',      reason:'Owner name spelling differs',          reason_hi:'मालिक के नाम की वर्तनी भिन्न',    frequency:132, percentage:32 },
    ];
    await db.write();
    console.log('✅ Seeded rejection patterns');
  }
  await db.write();
  console.log('✅ Database ready:', DB_PATH);
  return db;
}

const dbWrapper = {
  init: initDB,
  get raw() { return db; },
  getRejectionPatterns(serviceType) {
    if (!db) return [];
    const all = db.data.rejection_patterns;
    return serviceType ? all.filter(p => p.service_type === serviceType).sort((a,b) => b.percentage - a.percentage) : all;
  },
  createApplication(app) {
    if (!db) return;
    db.data.applications.push({ ...app, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    db.write();
  },
  getApplication(id) { return db ? (db.data.applications.find(a => a.id === id) || null) : null; },
  updateApplication(id, updates) {
    if (!db) return;
    const idx = db.data.applications.findIndex(a => a.id === id);
    if (idx >= 0) { db.data.applications[idx] = { ...db.data.applications[idx], ...updates, updated_at: new Date().toISOString() }; db.write(); }
  },
  listApplications(filters = {}) {
    if (!db) return [];
    let apps = [...db.data.applications];
    if (filters.serviceType) apps = apps.filter(a => a.service_type === filters.serviceType);
    if (filters.status) apps = apps.filter(a => a.status === filters.status);
    return apps.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, filters.limit || 20);
  },
  countApplications() { return db ? db.data.applications.length : 0; },
  countTodayApplications() {
    if (!db) return 0;
    const today = new Date().toISOString().split('T')[0];
    return db.data.applications.filter(a => a.created_at && a.created_at.startsWith(today)).length;
  },
  addConversation(conv) {
    if (!db) return;
    db.data.ai_conversations.push({ ...conv, id: Date.now(), created_at: new Date().toISOString() });
    db.write();
  },
};

module.exports = dbWrapper;
