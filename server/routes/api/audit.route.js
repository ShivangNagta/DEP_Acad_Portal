const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const { getAllAuditLogs } = require('../../controllers/audit.controller');

router.use(authenticate);

// All roles can view audit logs (filtered by role)
router.get('/', getAllAuditLogs);

module.exports = router;
