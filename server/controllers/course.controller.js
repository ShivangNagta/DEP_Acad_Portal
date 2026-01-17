const supabase = require('../supabase');
const logger = require('pino')();

const getAllCourses = async (req, res) => {
  try {
    let query = supabase
      .from('courses')
      .select(`*, instructor:users(email, entry_number)`);

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

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (error) {
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

    res.json(course);
  } catch (error) {
    logger.error('Get course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createCourse = async (req, res) => {
  try {
    const { course_code, title, department, credits, academic_session } = req.body;

    if (!course_code || !title) {
      return res.status(400).json({ error: 'Course code and title are required' });
    }

    const initialStatus = req.user.role === 'admin' ? 'approved' : 'pending';

    console.log(initialStatus)

    const courseData = {
      course_code,
      title,
      department,
      credits,
      instructor_id: req.user.id,
      academic_session,
      status: initialStatus
    };

    const { data, error } = await supabase
      .from('courses')
      .insert([courseData])
      .select()
      .single();

    if (error) throw error;

    // Log audit
    await supabase.from('audit_logs').insert({
      actor_id: req.user.id,
      action: 'CREATE_COURSE',
      metadata: { course_id: data.id }
    });

    res.status(201).json(data);
  } catch (error) {
    console.log(error)
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

