const supabase = require('../supabase');
const logger = require('pino')();

// Get all users
const getAllUsers = async (req, res) => {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('*, departments(id, name, code)')
            .order('created_at', { ascending: false });
        // console.log(data)
        if (error) {
            logger.error('Get users error:', error);
            return res.status(400).json({ error: error.message });
        }

        res.json(users);
    } catch (error) {
        logger.error('Get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Add new user (professor/student) - Only emails allowed in users table can login
const addUser = async (req, res) => {
    try {
        const { email, role, entry_number, name, batch, department_id } = req.body;

        if (!email || !role) {
            return res.status(400).json({
                error: 'Email and role are required'
            });
        }

        if (!['professor', 'student'].includes(role)) {
            return res.status(400).json({
                error: 'Role must be either "professor" or "student"'
            });
        }

        const { data: existingUser } = await supabase
            .from('users')
            .select('email')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(400).json({
                error: 'User with this email already exists'
            });
        }

        const userData = {
            email,
            role,
            name: name || null,
            entry_number: role === 'student' ? entry_number : null,
            batch: role === 'student' ? batch : null,
            department_id: department_id || null
        };

        const { data, error } = await supabase
            .from('users')
            .insert([userData])
            .select('*, departments(id, name, code)')
            .single();

        if (error) {
            logger.error('Add user error:', error);
            return res.status(400).json({ error: error.message });
        }

        // Log audit
        await supabase.from('audit_logs').insert({
            actor_id: req.user.id,
            action: 'ADD_USER',
            metadata: {
                user_email: email,
                role,
                name,
                added_by: req.user.email
            }
        });

        res.status(201).json({
            message: 'User added successfully. They can now login with OTP.',
            user: data
        });
    } catch (error) {
        logger.error('Add user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update user role/entry number
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Prevent role updates to/from admin
        if (updates.role && updates.role === 'admin') {
            return res.status(403).json({
                error: 'Cannot assign admin role via API'
            });
        }

        // Get current user data
        const { data: currentUser } = await supabase
            .from('users')
            .select('role')
            .eq('id', id)
            .single();

        if (currentUser?.role === 'admin') {
            return res.status(403).json({
                error: 'Cannot modify admin users'
            });
        }

        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            logger.error('Update user error:', error);
            return res.status(400).json({ error: error.message });
        }

        // Log audit
        await supabase.from('audit_logs').insert({
            actor_id: req.user.id,
            action: 'UPDATE_USER',
            metadata: {
                user_id: id,
                updates,
                updated_by: req.user.email
            }
        });

        res.json({
            message: 'User updated successfully',
            user: data
        });
    } catch (error) {
        logger.error('Update user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete user (only professors/students)
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Get user to check if they're admin
        const { data: user } = await supabase
            .from('users')
            .select('role, email')
            .eq('id', id)
            .single();

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.role === 'admin') {
            return res.status(403).json({
                error: 'Cannot delete admin users'
            });
        }

        // Delete from users table
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) {
            logger.error('Delete user error:', error);
            return res.status(400).json({ error: error.message });
        }

        // Log audit
        await supabase.from('audit_logs').insert({
            actor_id: req.user.id,
            action: 'DELETE_USER',
            metadata: {
                user_id: id,
                user_email: user.email,
                deleted_by: req.user.email
            }
        });

        res.json({
            message: 'User deleted successfully. They can no longer login.'
        });
    } catch (error) {
        logger.error('Delete user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get user statistics
const getUserStats = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('role')
            .neq('role', 'admin');

        if (error) {
            logger.error('Get user stats error:', error);
            return res.status(400).json({ error: error.message });
        }

        const stats = {
            total: data.length,
            professors: data.filter(u => u.role === 'professor').length,
            students: data.filter(u => u.role === 'student').length
        };

        res.json(stats);
    } catch (error) {
        logger.error('Get user stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get enrollment/drop deadline (returns the deadline from any course as they should all be the same)
const getEnrollmentDeadline = async (req, res) => {
    try {
        // Get the first course that has an enrollment_deadline set
        const { data, error } = await supabase
            .from('courses')
            .select('enrollment_deadline')
            .order('created_at', { ascending: true })
            .limit(1);

        if (error) {
            logger.error('Supabase error in getEnrollmentDeadline:', error);
            throw error;
        }

        // Check if any course has a deadline
        let deadline = null;
        if (data && data.length > 0 && data[0].enrollment_deadline) {
            deadline = data[0].enrollment_deadline;
        }

        res.json({ deadline });
    } catch (error) {
        logger.error('Get enrollment deadline error:', error);
        res.status(400).json({ error: error.message });
    }
};

// Set enrollment/drop deadline for all courses
const setEnrollmentDeadline = async (req, res) => {
    try {
        const { deadline } = req.body;
        const user_id = req.user.id;

        if (!deadline) {
            return res.status(400).json({ error: 'Deadline date is required' });
        }

        // Validate date format
        const deadlineDate = new Date(deadline);
        if (isNaN(deadlineDate.getTime())) {
            return res.status(400).json({ error: 'Invalid date format' });
        }

        const { data, error } = await supabase
            .from('courses')
            .update({ enrollment_deadline: deadline })
            .not('id', 'is', null)   // WHERE id IS NOT NULL  (updates all rows)
            .select()

        if (error) throw error;


        // Log audit
        await supabase.from('audit_logs').insert({
            actor_id: user_id,
            action: 'SET_ENROLLMENT_DEADLINE',
            metadata: {
                deadline,
                courses_updated: data?.length || 0
            }
        });

        res.json({ 
            message: 'Enrollment deadline updated successfully for all courses',
            deadline: deadline,
            courses_updated: data?.length || 0
        });
    } catch (error) {
        logger.error('Set enrollment deadline error:', error);
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    getAllUsers,
    addUser,
    updateUser,
    deleteUser,
    getUserStats,
    getEnrollmentDeadline,
    setEnrollmentDeadline
};
