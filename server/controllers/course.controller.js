const supabase = require('../supabase');
const logger = require('pino')();

const getAllCourses = async (req, res) => {
  try {
    let query = supabase
      .from('courses')
      .select(`*, instructor:users(id, name, entry_number, department_id, departments(id, name, code))`);

    // Allow Professors to see ALL courses if ?view=all is passed
    // Otherwise, restrict to their own courses by default
    if (req.user.role === 'professor') {
      if (req.query.view !== 'all') {
        query = query.eq('instructor_id', req.user.id);
      }
    }
    else if (req.user.role === 'student') {
      query = query.eq('status', 'approved');
    }

    let { data, error } = await query.order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    
    // Apply student eligibility filtering
    if (req.user.role === 'student') {
      // Get student's batch and department
      const { data: student } = await supabase
        .from('users')
        .select('batch, department_id, departments(id, name)')
        .eq('id', req.user.id)
        .single();

      if (!student) {
        return res.status(404).json({ error: 'Student profile not found' });
      }

      // Filter courses based on eligibility
      const eligibleCourses = [];

      for (const course of data) {
        // Check if course has any eligibility restrictions
        const { data: batchEligibilities } = await supabase
          .from('course_batch_eligibility')
          .select('batch_year')
          .eq('course_id', course.id);

        const { data: deptEligibilities } = await supabase
          .from('course_department_eligibility')
          .select('department_id')
          .eq('course_id', course.id);

        // If no eligibilities set, course is open to all
        if (!batchEligibilities || batchEligibilities.length === 0) {
          // No batch restriction
        } else {
          // Check if student's batch is in eligible batches
          const batchMatches = batchEligibilities.some(e => e.batch_year === student.batch);
          if (!batchMatches) continue; // Skip this course
        }

        if (!deptEligibilities || deptEligibilities.length === 0) {
          // No department restriction
        } else {
          // Check if student's department is in eligible departments
          const deptMatches = deptEligibilities.some(e => e.department_id === student.department_id);
          if (!deptMatches) continue; // Skip this course
        }

        // If both checks passed (or no restrictions), add to eligible courses
        eligibleCourses.push(course);
      }

      data = eligibleCourses;
    }
    
    res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: course, error } = await supabase
      .from('courses')
      .select(`
        *,
        instructor:users(*),
        enrollments(
          *,
          student:users(*)
        ),
        grades(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      logger.error('Get course error:', error);
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check access permissions
    if (req.user.role === 'professor' && course.instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Fetch eligible batches
    const { data: batchEligibilities } = await supabase
      .from('course_batch_eligibility')
      .select('batch_year')
      .eq('course_id', id);

    // Fetch eligible departments with details
    const { data: deptEligibilities } = await supabase
      .from('course_department_eligibility')
      .select('department_id, departments(id, name, code)')
      .eq('course_id', id);

    res.json({
      ...course,
      eligible_batches: batchEligibilities?.map(e => e.batch_year) || [],
      eligible_departments: deptEligibilities?.map(e => e.departments) || []
    });
  } catch (error) {
    logger.error('Get course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createCourse = async (req, res) => {
  try {
    const { course_code, title, credits, academic_session, eligible_batches, eligible_departments, slot } = req.body;

    if (!course_code || !title || !slot) {
      return res.status(400).json({ error: 'Course code, title, and slot are required' });
    }

    // Validate slot value
    const validSlots = ['T-PCPE', 'PC-1', 'PC-2', 'PC-3', 'PC-4', 'HSME', 'PCPE', 'HSPE', 'PHSME'];
    if (!validSlots.includes(slot)) {
      return res.status(400).json({ error: 'Invalid slot value' });
    }

    // Check if professor already has a course with this slot
    const { data: existingCourse } = await supabase
      .from('courses')
      .select('id')
      .eq('instructor_id', req.user.id)
      .eq('slot', slot)
      .single();

    if (existingCourse) {
      return res.status(400).json({ error: `You already have a course in slot ${slot}. Each professor can propose only one course per slot.` });
    }

    const initialStatus = req.user.role === 'admin' ? 'approved' : 'pending';

    // Create the course
    const courseData = {
      course_code,
      title,
      credits,
      instructor_id: req.user.id,
      academic_session,
      slot,
      status: initialStatus
    };

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .insert([courseData])
      .select()
      .single();

    if (courseError) throw courseError;

    // Add batch eligibilities
    if (eligible_batches && Array.isArray(eligible_batches) && eligible_batches.length > 0) {
      const batchEligibilities = eligible_batches.map(batch => ({
        course_id: course.id,
        batch_year: parseInt(batch)
      }));

      const { error: batchError } = await supabase
        .from('course_batch_eligibility')
        .insert(batchEligibilities);

      if (batchError) throw batchError;
    }

    // Add department eligibilities
    if (eligible_departments && Array.isArray(eligible_departments) && eligible_departments.length > 0) {
      const deptEligibilities = eligible_departments.map(deptId => ({
        course_id: course.id,
        department_id: deptId
      }));

      const { error: deptError } = await supabase
        .from('course_department_eligibility')
        .insert(deptEligibilities);

      if (deptError) throw deptError;
    }

    // Log audit
    await supabase.from('audit_logs').insert({
      actor_id: req.user.id,
      action: 'CREATE_COURSE',
      metadata: { course_id: course.id, eligible_batches, eligible_departments }
    });

    res.status(201).json({
      ...course,
      eligible_batches: eligible_batches || [],
      eligible_departments: eligible_departments || []
    });
  } catch (error) {
    console.log(error);
    logger.error('Create course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if professor owns the course
    if (req.user.role === 'professor') {
      const { data: course } = await supabase
        .from('courses')
        .select('instructor_id')
        .eq('id', id)
        .single();

      if (!course || course.instructor_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const { data, error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Update course error:', error);
      return res.status(400).json({ error: error.message });
    }

    // Log audit
    await supabase.from('audit_logs').insert({
      actor_id: req.user.id,
      action: 'UPDATE_COURSE',
      metadata: { course_id: id, updates }
    });

    res.json(data);
  } catch (error) {
    logger.error('Update course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if professor owns the course
    if (req.user.role === 'professor') {
      const { data: course } = await supabase
        .from('courses')
        .select('instructor_id')
        .eq('id', id)
        .single();

      if (!course || course.instructor_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Delete course error:', error);
      return res.status(400).json({ error: error.message });
    }

    // Log audit
    await supabase.from('audit_logs').insert({
      actor_id: req.user.id,
      action: 'DELETE_COURSE',
      metadata: { course_id: id }
    });

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    logger.error('Delete course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse
};

