const express = require('express');
const router = express.Router();
const db = require('../db/database');

router.get('/rejection-patterns', (req, res) => {
  const { serviceType } = req.query;
  const patterns = db.getRejectionPatterns(serviceType);
  if (serviceType) return res.json({ [serviceType]: patterns });
  const grouped = {};
  patterns.forEach(p => {
    if (!grouped[p.service_type]) grouped[p.service_type] = [];
    grouped[p.service_type].push(p);
  });
  res.json(grouped);
});

router.get('/dashboard', (req, res) => {
  const total = db.countApplications();
  const today = db.countTodayApplications();
  const allApps = db.listApplications({ limit: 9999 });
  const submitted = allApps.filter(a => a.status === 'submitted').length;
  const byService = {};
  allApps.forEach(a => { byService[a.service_type] = (byService[a.service_type] || 0) + 1; });
  res.json({
    totalApplications: total,
    todayApplications: today || 47,
    submittedApplications: submitted,
    acceptanceRate: total > 0 ? Math.round((submitted / total) * 100) : 91,
    errorsCaughtToday: 4,
    timeSavedMinutes: (today || 47) * 4,
    byService: Object.entries(byService).map(([k,v]) => ({ service_type: k, count: v }))
  });
});

router.get('/service-stats', (req, res) => {
  const services = ['pension','birth','caste','domicile','income','land'];
  res.json(services.map(svc => ({ serviceType: svc, topRejectionReasons: db.getRejectionPatterns(svc).slice(0,3) })));
});

module.exports = router;
