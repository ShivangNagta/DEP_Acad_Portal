const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');
const {
    getAllCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse
} = require('../../controllers/course.controller');

router.use(authenticate);

// All roles can view courses
router.get('/', getAllCourses);
router.get('/:id', getCourseById);

// Only professors and admins can create/update/delete courses
router.post('/', authorize('professor', 'admin'), createCourse);
router.put('/:id', authorize('professor', 'admin'), updateCourse);
router.delete('/:id', authorize('professor', 'admin'), deleteCourse);

module.exports = router;
