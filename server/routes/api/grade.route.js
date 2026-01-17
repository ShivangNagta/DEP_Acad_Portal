const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');
const {
    getAllGrades,
    submitGrade,
    updateGrade,
    deleteGrade,
    publishGrades
} = require('../../controllers/grade.controller');

router.use(authenticate);

// All roles can view grades (filtered by role)
router.get('/', getAllGrades);

// Only professors can submit/update/delete grades
router.post('/', authorize('professor'), submitGrade);
router.put('/:id', authorize('professor'), updateGrade);
router.delete('/:id', authorize('professor'), deleteGrade);
router.post('/publish', authorize('admin'), publishGrades);

module.exports = router;
