const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const {
    getQuestions,
    getInstructorsList,
    submitFeedback,
    getFeedbackStats,
    checkFeedbackExists,
    getCurrentSession
} = require('../../controllers/feedback.controller');

router.get('/questions', getQuestions);
router.get('/instructors', authenticate, getInstructorsList);
router.post('/submit', authenticate, submitFeedback);
router.get('/stats', authenticate, getFeedbackStats);
router.get('/check', authenticate, checkFeedbackExists);
router.get('/current-session', authenticate, getCurrentSession);

module.exports = router;
