const supabase = require('../supabase');
const logger = require('pino')();

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            logger.error('Authentication error:', error);
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Get user role from database
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (userError || !userData) {
            logger.error('User not found in database:', userError);
            return res.status(404).json({ error: 'User not found' });
        }

        req.user = {
            id: user.id,
            email: user.email,
            role: userData.role,
            entryNumber: userData.entry_number
        };

        next();
    } catch (error) {
        logger.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};

module.exports = { authenticate };
