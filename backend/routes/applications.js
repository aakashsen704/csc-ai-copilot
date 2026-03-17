const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');

router.post('/', (req, res) => {
  const { serviceType, formData, operatorId } = req.body;
  const id = uuidv4();
  db.createApplication({ id, service_type: serviceType || 'pension', form_data: formData || {}, operator_id: operatorId || 'default', status: 'draft', risk_score: 0 });
  res.json({ id, message: 'Application created' });
});

router.get('/:id', (req, res) => {
  const app = db.getApplication(req.params.id);
  if (!app) return res.status(404).json({ error: 'Not found' });
  res.json(app);
});

router.put('/:id', (req, res) => {
  const { formData, riskScore, status } = req.body;
  const updates = {};
  if (formData !== undefined) updates.form_data = formData;
  if (riskScore !== undefined) updates.risk_score = riskScore;
  if (status) updates.status = status;
  db.updateApplication(req.params.id, updates);
  res.json({ message: 'Updated' });
});

router.post('/:id/submit', (req, res) => {
  const app = db.getApplication(req.params.id);
  if (!app) return res.status(404).json({ error: 'Not found' });
  const refNumber = `CSC-${Date.now().toString().slice(-6)}`;
  db.updateApplication(req.params.id, { status: 'submitted', submitted_at: new Date().toISOString(), reference_number: refNumber });
  res.json({ success: true, referenceNumber: refNumber, estimatedDays: 7, message: 'Application submitted successfully', message_hi: 'आवेदन सफलतापूर्वक जमा हुआ' });
});

router.get('/', (req, res) => {
  const { serviceType, status, limit = 20 } = req.query;
  const apps = db.listApplications({ serviceType, status, limit: parseInt(limit) });
  res.json({ applications: apps, total: db.countApplications() });
});

module.exports = router;
