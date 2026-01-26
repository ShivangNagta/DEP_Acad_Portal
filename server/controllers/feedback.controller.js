const supabase = require('../supabase');
const logger = require('pino')();

const _getCurrentSession = async () => {
    try {
        const { data, error } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'current_session')
            .single();
        return data?.value || '2025-2026';
    } catch (e) {
        return '2025-2026';
    }
};

const getCurrentSession = async (req, res) => {
    try {
        const session = await _getCurrentSession();
        res.json({ session });
    } catch (error) {
        logger.error('Get current session error:', error);
        res.status(400).json({ error: error.message });
    }
};

const getQuestions = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('feedback_questions')
            .select('*')
            .order('question_order', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        logger.error('Get questions error:', error);
        res.status(400).json({ error: error.message });
    }
};

const getInstructorsList = async (req, res) => {
    try {
        const currentSession = await _getCurrentSession();
        const { data, error } = await supabase
            .from('courses')
            .select('id, title, course_code, instructor_id, instructor:users(id, name, entry_number, departments(name, code)), academic_session')
            .eq('academic_session', currentSession)
            .eq('status', 'approved');

        if (error) throw error;

        // Transform to include course and instructor details
        const instructorCourses = data.map(course => ({
            course_id: course.id,
            course_title: course.title,
            course_code: course.course_code,
            instructor_id: course.instructor_id,
            instructor_name: course.instructor?.name || 'Unknown',
            department_name: course.instructor?.departments?.name || 'Unknown',
            department_code: course.instructor?.departments?.code || 'N/A'
        }));

        res.json(instructorCourses);
    } catch (error) {
        logger.error('Get instructors error:', error);
        res.status(400).json({ error: error.message });
    }
};

const submitFeedback = async (req, res) => {
    try {
        const { course_id, instructor_id, semester, responses } = req.body;
        const student_id = req.user.id;
        const currentSession = await _getCurrentSession();

        if (!course_id || !instructor_id || !semester || !responses || responses.length === 0) {
            return res.status(400).json({ error: 'Invalid feedback data' });
        }

        if (!['mid', 'end'].includes(semester)) {
            return res.status(400).json({ error: 'Invalid semester type' });
        }

        // Create a unique session identifier that includes course and semester info
        const sessionKey = `${currentSession}|${course_id}|${semester}`;

        const feedbackRecords = responses.map(r => ({
            student_id,
            instructor_id,
            question_id: r.question_id,
            response: r.response,
            session: sessionKey
        }));

        const { error } = await supabase
            .from('student_feedback')
            .insert(feedbackRecords);

        if (error) throw error;

        res.json({ message: 'Feedback submitted successfully' });
    } catch (error) {
        logger.error('Submit feedback error:', error);
        res.status(400).json({ error: error.message });
    }
};

const getFeedbackStats = async (req, res) => {
    try {
        const instructor_id = req.user.id;
        const { course_id, semester } = req.query;
        const currentSession = await _getCurrentSession();

        let query = supabase
            .from('student_feedback')
            .select('question_id, response, session')
            .eq('instructor_id', instructor_id);

        // If course_id and semester are provided, filter by them
        if (course_id && semester) {
            const sessionKey = `${currentSession}|${course_id}|${semester}`;
            query = query.eq('session', sessionKey);
        } else {
            // Otherwise get all feedback for current session (legacy support)
            query = query.ilike('session', `${currentSession}%`);
        }

        const { data: feedbackData, error } = await query;

        if (error) throw error;

        const { data: questions } = await supabase
            .from('feedback_questions')
            .select('*')
            .order('question_order', { ascending: true });

        const stats = {};
        questions.forEach(q => {
            stats[q.id] = {
                question_text: q.question_text,
                responses: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            };
        });

        feedbackData.forEach(feedback => {
            if (stats[feedback.question_id]) {
                stats[feedback.question_id].responses[feedback.response]++;
            }
        });

        const result = questions.map(q => ({
            id: q.id,
            question_text: q.question_text,
            responses: stats[q.id]?.responses || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            total_responses: Object.values(stats[q.id]?.responses || {}).reduce((a, b) => a + b, 0)
        }));

        res.json(result);
    } catch (error) {
        logger.error('Get feedback stats error:', error);
        res.status(400).json({ error: error.message });
    }
};

const checkFeedbackExists = async (req, res) => {
    try {
        const { course_id, semester } = req.query;
        const student_id = req.user.id;
        const currentSession = await _getCurrentSession();

        if (!course_id || !semester) {
            return res.json({ exists: false });
        }

        // Create the same session key format used in submitFeedback
        const sessionKey = `${currentSession}|${course_id}|${semester}`;

        const { data, error } = await supabase
            .from('student_feedback')
            .select('id')
            .eq('student_id', student_id)
            .ilike('session', `${sessionKey}%`)
            .single();

        res.json({ exists: !!data });
    } catch (error) {
        res.json({ exists: false });
    }
};

module.exports = {
    getQuestions,
    getInstructorsList,
    submitFeedback,
    getFeedbackStats,
    checkFeedbackExists,
    getCurrentSession
};
