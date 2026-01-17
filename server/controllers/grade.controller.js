const supabase = require('../supabase');
const logger = require('pino')();

// const getAllGrades = async (req, res) => {
//   try {
//     let query = supabase
//       .from('grades')
//       .select(`
//         *,
//         course:courses(*),
//         student:users(email, entry_number)
//       `);

//     // Filter based on role
//     if (req.user.role === 'professor') {
//       const { data: courses } = await supabase
//         .from('courses')
//         .select('id')
//         .eq('instructor_id', req.user.id);

//       const courseIds = courses?.map(c => c.id) || [];
//       query = query.in('course_id', courseIds);
//     } else if (req.user.role === 'student') {
//       query = query.eq('student_id', req.user.id);
//     }

//     const { data, error } = await query.order('created_at', { ascending: false });

//     if (error) {
//       logger.error('Get grades error:', error);
//       return res.status(400).json({ error: error.message });
//     }

//     res.json(data);
//   } catch (error) {
//     logger.error('Get grades error:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };

// const submitGrade = async (req, res) => {
//   try {
//     const { course_id, student_id, marks, grade, semester } = req.body;

//     if (!course_id || !student_id || marks === undefined) {
//       return res.status(400).json({
//         error: 'Course ID, Student ID, and marks are required'
//       });
//     }

//     // Check if professor teaches this course
//     const { data: course } = await supabase
//       .from('courses')
//       .select('instructor_id')
//       .eq('id', course_id)
//       .single();

//     if (!course || course.instructor_id !== req.user.id) {
//       return res.status(403).json({ error: 'Access denied' });
//     }

//     const gradeData = {
//       course_id,
//       student_id,
//       marks,
//       grade,
//       semester
//     };

//     const { data, error } = await supabase
//       .from('grades')
//       .upsert(gradeData, {
//         onConflict: 'course_id,student_id,semester',
//         ignoreDuplicates: false
//       })
//       .select()
//       .single();

//     if (error) {
//       logger.error('Submit grade error:', error);
//       return res.status(400).json({ error: error.message });
//     }

//     // Log audit
//     await supabase.from('audit_logs').insert({
//       actor_id: req.user.id,
//       action: 'SUBMIT_GRADE',
//       metadata: {
//         grade_id: data.id,
//         course_id,
//         student_id,
//         marks
//       }
//     });

//     res.status(201).json(data);
//   } catch (error) {
//     logger.error('Submit grade error:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };

const updateGrade = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Get grade to check permissions
    const { data: grade } = await supabase
      .from('grades')
      .select('course:courses(*)')
      .eq('id', id)
      .single();

    if (!grade) {
      return res.status(404).json({ error: 'Grade not found' });
    }

    if (grade.course.instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data, error } = await supabase
      .from('grades')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Update grade error:', error);
      return res.status(400).json({ error: error.message });
    }

    // Log audit
    await supabase.from('audit_logs').insert({
      actor_id: req.user.id,
      action: 'UPDATE_GRADE',
      metadata: { grade_id: id, updates }
    });

    res.json(data);
  } catch (error) {
    logger.error('Update grade error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteGrade = async (req, res) => {
  try {
    const { id } = req.params;

    // Get grade to check permissions
    const { data: grade } = await supabase
      .from('grades')
      .select('course:courses(*)')
      .eq('id', id)
      .single();

    if (!grade) {
      return res.status(404).json({ error: 'Grade not found' });
    }

    if (grade.course.instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { error } = await supabase
      .from('grades')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Delete grade error:', error);
      return res.status(400).json({ error: error.message });
    }

    // Log audit
    await supabase.from('audit_logs').insert({
      actor_id: req.user.id,
      action: 'DELETE_GRADE',
      metadata: { grade_id: id }
    });

    res.json({ message: 'Grade deleted successfully' });
  } catch (error) {
    logger.error('Delete grade error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAllGrades = async (req, res) => {
  try {
    let query = supabase.from('grades').select(`*, course:courses(*), student:users(email, entry_number)`);

    if (req.user.role === 'professor') {
      // Professors see grades for their courses
      const { data: courses } = await supabase.from('courses').select('id').eq('instructor_id', req.user.id);
      const courseIds = courses?.map(c => c.id) || [];
      query = query.in('course_id', courseIds);
    }
    else if (req.user.role === 'student') {
      // Students only see published grades
      query = query.eq('student_id', req.user.id).eq('status', 'published');
    }
    // Admins see everything

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const submitGrade = async (req, res) => {
  try {
    const { course_id, student_id, marks, semester } = req.body;

    if (!course_id || !student_id || marks === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const initialStatus = req.user.role === 'admin' ? 'published' : 'submitted';

    const gradeData = {
      course_id,
      student_id,
      marks,
      grade: calculateGrade(marks),
      semester: semester || 1,
      status: initialStatus
    };

    const { data, error } = await supabase
      .from('grades')
      .upsert(gradeData, { onConflict: 'course_id,student_id,semester' })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Helper to determine letter grade
const calculateGrade = (m) => {
  if (m >= 90) return 'A';
  if (m >= 80) return 'B';
  if (m >= 70) return 'C';
  if (m >= 60) return 'D';
  return 'F';
};

const publishGrades = async (req, res) => {
  try {
    const { course_id } = req.body;

    const { data, error } = await supabase
      .from('grades')
      .update({ status: 'published' })
      .eq('course_id', course_id)
      .eq('status', 'submitted')
      .select();

    if (error) throw error;
    res.json({ message: `Published ${data.length} grades`, data });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getAllGrades,
  submitGrade,
  updateGrade,
  deleteGrade,
  publishGrades
};
