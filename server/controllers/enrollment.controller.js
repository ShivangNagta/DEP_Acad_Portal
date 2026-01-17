const supabase = require('../supabase');
const logger = require('pino')();

const getAllEnrollments = async (req, res) => {
  try {
    let query = supabase
      .from('enrollments')
      .select(`
        *,
        course:courses(*),
        student:users(email, entry_number)
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
    const { course_id } = req.body;

    if (!course_id) {
      return res.status(400).json({ error: 'Course ID is required' });
    }

    // Check if already enrolled
    const { data: existing } = await supabase
      .from('enrollments')
      .select('*')
      .eq('course_id', course_id)
      .eq('student_id', req.user.id)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    const enrollmentData = {
      course_id,
      student_id: req.user.id,
      status: 'pending'
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
      metadata: { enrollment_id: data.id, course_id }
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

module.exports = {
  getAllEnrollments,
  requestEnrollment,
  updateEnrollmentStatus,
  deleteEnrollment
};
