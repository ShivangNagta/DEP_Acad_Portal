const supabase = require('../supabase');
const logger = require('pino')();

const getAllStudents = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'student')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Get students error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    logger.error('Get students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: student, error } = await supabase
      .from('users')
      .select(`
        *,
        enrollments(
          *,
          course:courses(*)
        ),
        grades(
          *,
          course:courses(*)
        )
      `)
      .eq('id', id)
      .eq('role', 'student')
      .single();

    if (error) {
      logger.error('Get student error:', error);
      return res.status(404).json({ error: 'Student not found' });
    }

    // Professors can only see students in their courses
    if (req.user.role === 'professor') {
      const { data: professorCourses } = await supabase
        .from('courses')
        .select('id')
        .eq('instructor_id', req.user.id);

      const professorCourseIds = professorCourses?.map(c => c.id) || [];

      // Filter enrollments and grades
      student.enrollments = student.enrollments?.filter(e =>
        professorCourseIds.includes(e.course_id)
      ) || [];

      student.grades = student.grades?.filter(g =>
        professorCourseIds.includes(g.course_id)
      ) || [];
    }

    res.json(student);
  } catch (error) {
    logger.error('Get student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getProfessorStudents = async (req, res) => {
  try {
    // Get students enrolled in professor's courses
    const { data: courses } = await supabase
      .from('courses')
      .select('id')
      .eq('instructor_id', req.user.id);

    const courseIds = courses?.map(c => c.id) || [];

    if (courseIds.length === 0) {
      return res.json([]);
    }

    const { data: enrollments } = await supabase
      .from('enrollments')
      .select(`
        student:users(*)
      `)
      .in('course_id', courseIds)
      .eq('status', 'approved');

    const uniqueStudents = [];
    const seenIds = new Set();

    enrollments?.forEach(e => {
      if (e.student && !seenIds.has(e.student.id)) {
        seenIds.add(e.student.id);
        uniqueStudents.push(e.student);
      }
    });

    res.json(uniqueStudents);
  } catch (error) {
    logger.error('Get professor students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  getProfessorStudents
};
