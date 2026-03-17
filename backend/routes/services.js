const express = require('express');
const router = express.Router();

const SERVICES = {
  pension: {
    id: 'pension', name: 'Old Age Pension', nameHi: 'वृद्धावस्था पेंशन', formNumber: '7A',
    rejectionRate: 31, rejectionColor: 'high',
    eligibility: { minAge: 60, maxIncome: 100000, minResidencyYears: 15, stateName: 'Chhattisgarh' },
    requiredDocuments: [
      { id: 'aadhaar', name: 'Aadhaar Card', nameHi: 'आधार कार्ड', required: true },
      { id: 'age_proof', name: 'Age Proof', nameHi: 'आयु प्रमाण', required: true, alternatives: ['Birth Certificate', 'School TC', 'Voter ID with DOB', 'Hospital Record'] },
      { id: 'bank_passbook', name: 'Bank Passbook (1st page)', nameHi: 'बैंक पासबुक (पहला पृष्ठ)', required: true },
      { id: 'income_cert', name: 'Income Certificate (< ₹1L/year)', nameHi: 'आय प्रमाण पत्र (< ₹1 लाख)', required: true },
      { id: 'photo', name: 'Passport Photo', nameHi: 'पासपोर्ट साइज फोटो', required: true },
      { id: 'residence_proof', name: 'Residence Proof', nameHi: 'निवास प्रमाण', required: false }
    ],
    fields: ['fullName', 'aadhaar', 'dob', 'gender', 'mobile', 'category', 'bankAccount', 'ifscCode', 'bankName', 'village', 'block', 'district', 'pincode', 'yearsAtAddress', 'annualIncome']
  },
  birth: {
    id: 'birth', name: 'Birth Certificate', nameHi: 'जन्म प्रमाण पत्र', formNumber: '4B',
    rejectionRate: 8, rejectionColor: 'low',
    eligibility: { maxDaysFromBirth: 21, note: 'Late fee applies after 21 days' },
    requiredDocuments: [
      { id: 'hospital_cert', name: 'Hospital Birth Certificate', nameHi: 'अस्पताल जन्म प्रमाण पत्र', required: true },
      { id: 'parents_aadhaar', name: "Parents' Aadhaar", nameHi: 'माता-पिता का आधार', required: true },
      { id: 'marriage_cert', name: 'Marriage Certificate', nameHi: 'विवाह प्रमाण पत्र', required: false }
    ],
    fields: ['childName', 'dob', 'gender', 'fatherName', 'motherName', 'fatherAadhaar', 'motherAadhaar', 'hospitalName', 'village', 'block', 'pincode', 'mobile']
  },
  caste: {
    id: 'caste', name: 'Caste Certificate', nameHi: 'जाति प्रमाण पत्र', formNumber: '6C',
    rejectionRate: 18, rejectionColor: 'medium',
    requiredDocuments: [
      { id: 'aadhaar', name: 'Aadhaar Card', nameHi: 'आधार कार्ड', required: true },
      { id: 'parent_caste', name: "Parent's Caste Certificate / Revenue Record", nameHi: 'माता/पिता का जाति प्रमाण', required: true },
      { id: 'residence_proof', name: 'Residence Proof', nameHi: 'निवास प्रमाण', required: true }
    ],
    fields: ['fullName', 'aadhaar', 'dob', 'gender', 'fatherName', 'category', 'subCaste', 'mobile', 'village', 'block', 'pincode']
  },
  domicile: {
    id: 'domicile', name: 'Domicile Certificate', nameHi: 'निवास प्रमाण पत्र', formNumber: '5A',
    rejectionRate: 15, rejectionColor: 'medium',
    eligibility: { minResidencyYears: 15 },
    requiredDocuments: [
      { id: 'aadhaar', name: 'Aadhaar Card (CG address)', nameHi: 'आधार कार्ड (CG पता)', required: true },
      { id: 'voter_id', name: 'Voter ID', nameHi: 'मतदाता पहचान पत्र', required: false },
      { id: 'ration_card', name: 'Ration Card', nameHi: 'राशन कार्ड', required: false },
      { id: 'utility_bill', name: 'Utility Bill (2+ years old)', nameHi: 'बिजली/पानी बिल (2+ वर्ष पुराना)', required: false }
    ],
    fields: ['fullName', 'aadhaar', 'dob', 'gender', 'mobile', 'village', 'block', 'pincode', 'yearsAtAddress', 'purpose']
  },
  income: {
    id: 'income', name: 'Income Certificate', nameHi: 'आय प्रमाण पत्र', formNumber: '3D',
    rejectionRate: 11, rejectionColor: 'low',
    requiredDocuments: [
      { id: 'aadhaar', name: 'Aadhaar Card', nameHi: 'आधार कार्ड', required: true },
      { id: 'income_source', name: 'Income Source Proof', nameHi: 'आय स्रोत प्रमाण', required: true },
      { id: 'bank_stmt', name: 'Bank Statement (6 months)', nameHi: 'बैंक स्टेटमेंट (6 माह)', required: true },
      { id: 'self_decl', name: 'Self Declaration (Notarised)', nameHi: 'स्व-घोषणा (नोटरीकृत)', required: true }
    ],
    fields: ['fullName', 'aadhaar', 'dob', 'gender', 'mobile', 'annualIncome', 'incomeSource', 'bankAccount', 'ifscCode', 'village', 'block', 'pincode', 'purpose']
  },
  land: {
    id: 'land', name: 'Land Record (B1)', nameHi: 'भूमि रिकॉर्ड बी-१', formNumber: 'B1',
    rejectionRate: 26, rejectionColor: 'high',
    requiredDocuments: [
      { id: 'aadhaar', name: 'Aadhaar Card', nameHi: 'आधार कार्ड', required: true },
      { id: 'khasra', name: 'Khasra/Khatauni Copy', nameHi: 'खसरा/खतौनी प्रति', required: true },
      { id: 'registry', name: 'Registry/Sale Deed', nameHi: 'रजिस्ट्री/विक्रय पत्र', required: false }
    ],
    fields: ['ownerName', 'aadhaar', 'mobile', 'khasraNumber', 'surveyNumber', 'areaHectare', 'village', 'block', 'pincode', 'purpose']
  }
};

router.get('/', (req, res) => res.json(Object.values(SERVICES)));
router.get('/:serviceType', (req, res) => {
  const svc = SERVICES[req.params.serviceType];
  if (!svc) return res.status(404).json({ error: 'Service not found' });
  res.json(svc);
});

module.exports = router;
