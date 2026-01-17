const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');
const {
    getAllStudents,
    getStudentById,
    getProfessorStudents
} = require('../../controllers/student.controller');

router.use(authenticate);

// Only admins can see all students
router.get('/', authorize('admin'), getAllStudents);

// Get students for a specific professor
router.get('/my-students', authorize('professor'), getProfessorStudents);

// All authenticated users can view specific student (with filters)
router.get('/:id', getStudentById);

module.exports = router;
