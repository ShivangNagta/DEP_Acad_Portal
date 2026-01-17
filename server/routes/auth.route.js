const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { sendOTP, verifyOTP, logout, getProfile, getSession } = require('../controllers/auth.controller');

// Public routes
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/logout', logout);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.get('/session', authenticate, getSession);

module.exports = router;
