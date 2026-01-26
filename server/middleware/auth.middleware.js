const supabase = require('../supabase');
const logger = require('pino')();

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        logger.info(`Auth middleware: checking authorization header`, { authHeader: !!authHeader });

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            logger.warn('Auth middleware: No valid Bearer token provided');
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        logger.info('Auth middleware: Verifying token with Supabase');

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error) {
            logger.error('Auth middleware: Token verification error:', error);
            return res.status(401).json({ error: 'Invalid token', details: error.message });
        }

        if (!user) {
            logger.warn('Auth middleware: No user returned from token');
            return res.status(401).json({ error: 'Invalid token' });
        }

        logger.info(`Auth middleware: Token valid for user ${user.id}`);

        // Get user role from database
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (userError) {
            logger.error('Auth middleware: Error fetching user from database:', userError);
            return res.status(404).json({ error: 'User not found in database', details: userError.message });
        }

        if (!userData) {
            logger.warn('Auth middleware: User data is null');
            return res.status(404).json({ error: 'User not found' });
        }

        logger.info(`Auth middleware: User authenticated - ${user.email} (${userData.role})`);

        req.user = {
            id: user.id,
            email: user.email,
            role: userData.role,
            entryNumber: userData.entry_number
        };

        next();
    } catch (error) {
        logger.error('Auth middleware: Unexpected error:', error);
        res.status(500).json({ error: 'Authentication failed', details: error.message });
    }
};

module.exports = { authenticate };
