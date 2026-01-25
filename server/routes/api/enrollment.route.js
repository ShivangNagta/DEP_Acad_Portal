const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');
const {
    getAllEnrollments,
    requestEnrollment,
    updateEnrollmentStatus,
    deleteEnrollment,
    dropCourse
} = require('../../controllers/enrollment.controller');

router.use(authenticate);

// All roles can view enrollments (filtered by role)
router.get('/', getAllEnrollments);

// Students can request enrollment
router.post('/', authorize('student'), requestEnrollment);

// Students can drop a course
router.post('/drop', authorize('student'), dropCourse);

// Professors can update enrollment status
router.put('/:id/status', authorize('professor'), updateEnrollmentStatus);

// Students can delete their own enrollments, admins can delete any
router.delete('/:id', authorize('student', 'professor', 'admin'), deleteEnrollment);

module.exports = router;
