const express = require('express');
const router = express.Router();
const { getAllDepartments, createDepartment } = require('../../controllers/department.controller');
const { authenticate } = require('../../middleware/auth.middleware');

// Get all departments (public, for dropdowns)
router.get('/', getAllDepartments);

// Create new department (admin only)
router.post('/', authenticate, createDepartment);

module.exports = router;
