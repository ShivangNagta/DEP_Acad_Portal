const supabase = require('../supabase');
const logger = require('pino')();

const getAllEnrollments = async (req, res) => {
  try {
    let query = supabase
      .from('enrollments')
      .select(`
        *,
        course:courses(id, course_code, title, credits, academic_session, instructor_id, enrollment_deadline, instructor:users(id, name, entry_number, departments(name, code))),
        student:users(id, name, entry_number, batch, department_id, departments(name, code))
      `);

    // Filter based on role
    if (req.user.role === 'professor') {
      // Get professor's courses first
      const { data: courses } = await supabase
        .from('courses')
        .select('id')
        .eq('instructor_id', req.user.id);

      const courseIds = courses?.map(c => c.id) || [];
      query = query.in('course_id', courseIds);
    } else if (req.user.role === 'student') {
      query = query.eq('student_id', req.user.id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      logger.error('Get enrollments error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    logger.error('Get enrollments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const requestEnrollment = async (req, res) => {
  try {
    const { course_id, semester } = req.body;

    if (!course_id || !semester) {
      return res.status(400).json({ error: 'Course ID and semester are required' });
    }

    // Validate semester format
    const validSemesters = ['sem-1', 'sem-2', 'sem-3', 'sem-4', 'sem-5', 'sem-6', 'sem-7', 'sem-8'];
    if (!validSemesters.includes(semester)) {
      return res.status(400).json({ error: 'Invalid semester' });
    }

    // Get student's batch and department
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('batch, department_id')
      .eq('id', req.user.id)
      .single();

    if (studentError || !student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', course_id)
      .single();

    if (courseError || !course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check batch eligibility
    const { data: batchEligibilities } = await supabase
      .from('course_batch_eligibility')
      .select('batch_year')
      .eq('course_id', course_id);

    if (batchEligibilities && batchEligibilities.length > 0) {
      const batchMatch = batchEligibilities.some(e => e.batch_year === student.batch);
      if (!batchMatch) {
        return res.status(403).json({ error: 'Not eligible for this course (batch mismatch)' });
      }
    }

    // Check department eligibility
    const { data: deptEligibilities } = await supabase
      .from('course_department_eligibility')
      .select('department_id')
      .eq('course_id', course_id);

    if (deptEligibilities && deptEligibilities.length > 0) {
      const deptMatch = deptEligibilities.some(e => e.department_id === student.department_id);
      if (!deptMatch) {
        return res.status(403).json({ error: 'Not eligible for this course (department mismatch)' });
      }
    }

    // Check if already enrolled in this course for this semester
    const { data: existing } = await supabase
      .from('enrollments')
      .select('*')
      .eq('course_id', course_id)
      .eq('student_id', req.user.id)
      .eq('semester', semester)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Already enrolled in this course for this semester' });
    }

    // Check credit limit for this semester (24 credits max)
    const { data: enrolledCourses } = await supabase
      .from('enrollments')
      .select('course:courses(credits)')
      .eq('student_id', req.user.id)
      .eq('semester', semester)
      .eq('status', 'approved');

    const totalCredits = (enrolledCourses || []).reduce((sum, e) => sum + (e.course?.credits || 0), 0);
    const courseCredits = course.credits || 0;

    if (totalCredits + courseCredits > 24) {
      return res.status(400).json({ error: `Credit limit exceeded. Maximum 24 credits per semester, you have ${totalCredits + courseCredits}` });
    }

    // Check if student already has a course in the same slot for this semester
    if (course.slot) {
      const { data: sameSlotEnrollments } = await supabase
        .from('enrollments')
        .select('course:courses(slot, id, title)')
        .eq('student_id', req.user.id)
        .eq('semester', semester)
        .in('status', ['pending', 'approved']);

      if (sameSlotEnrollments && sameSlotEnrollments.length > 0) {
        const conflictingCourse = sameSlotEnrollments.find(e => e.course?.slot === course.slot);
        if (conflictingCourse) {
          return res.status(400).json({ 
            error: `Cannot enroll in multiple courses of the same slot. You already have "${conflictingCourse.course?.title}" in slot ${course.slot}.` 
          });
        }
      }
    }

    const enrollmentData = {
      course_id,
      student_id: req.user.id,
      status: 'pending',
      semester
    };

    const { data, error } = await supabase
      .from('enrollments')
      .insert([enrollmentData])
      .select()
      .single();

    if (error) {
      logger.error('Enrollment request error:', error);
      return res.status(400).json({ error: error.message });
    }

    // Log audit
    await supabase.from('audit_logs').insert({
      actor_id: req.user.id,
      action: 'REQUEST_ENROLLMENT',
      metadata: { enrollment_id: data.id, course_id, semester }
    });

    res.status(201).json(data);
  } catch (error) {
    logger.error('Enrollment request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateEnrollmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Check if professor teaches this course
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select(`
        *,
        course:courses(*)
      `)
      .eq('id', id)
      .single();

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    if (enrollment.course.instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data, error } = await supabase
      .from('enrollments')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Update enrollment error:', error);
      return res.status(400).json({ error: error.message });
    }

    // Log audit
    await supabase.from('audit_logs').insert({
      actor_id: req.user.id,
      action: 'UPDATE_ENROLLMENT_STATUS',
      metadata: { enrollment_id: id, old_status: enrollment.status, new_status: status }
    });

    res.json(data);
  } catch (error) {
    logger.error('Update enrollment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteEnrollment = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('*')
      .eq('id', id)
      .single();

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    // Check permissions
    if (req.user.role === 'student' && enrollment.student_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { error } = await supabase
      .from('enrollments')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Delete enrollment error:', error);
      return res.status(400).json({ error: error.message });
    }

    // Log audit
    await supabase.from('audit_logs').insert({
      actor_id: req.user.id,
      action: 'DELETE_ENROLLMENT',
      metadata: { enrollment_id: id }
    });

    res.json({ message: 'Enrollment deleted successfully' });
  } catch (error) {
    logger.error('Delete enrollment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Drop course - Student drops their enrollment
const dropCourse = async (req, res) => {
  try {
    const { course_id } = req.body;
    const student_id = req.user.id;

    if (!course_id) {
      return res.status(400).json({ error: 'Course ID is required' });
    }

    // Check if enrollment exists
    const { data: enrollment, error: fetchError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('course_id', course_id)
      .eq('student_id', student_id)
      .single();

    if (fetchError || !enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    // Check deadline from the course
    const { data: course } = await supabase
      .from('courses')
      .select('enrollment_deadline')
      .eq('id', course_id)
      .single();

    const deadline = course?.enrollment_deadline;
    if (deadline) {
      const deadlineDate = new Date(deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (today > deadlineDate) {
        return res.status(403).json({ error: 'Enrollment/drop deadline has passed' });
      }
    }

    // Delete the enrollment
    const { error: deleteError } = await supabase
      .from('enrollments')
      .delete()
      .eq('id', enrollment.id);

    if (deleteError) {
      throw deleteError;
    }

    // Log audit
    await supabase.from('audit_logs').insert({
      actor_id: student_id,
      action: 'DROP_COURSE',
      metadata: { course_id, enrollment_id: enrollment.id }
    });

    res.json({ message: 'Course dropped successfully' });
  } catch (error) {
    logger.error('Drop course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllEnrollments,
  requestEnrollment,
  updateEnrollmentStatus,
  deleteEnrollment,
  dropCourse
};
