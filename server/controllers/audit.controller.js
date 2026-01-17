const supabase = require('../supabase');
const logger = require('pino')();

const getAllAuditLogs = async (req, res) => {
  try {
    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        actor:users(email, entry_number)
      `);

    // Filter based on role
    if (req.user.role === 'professor') {
      query = query.eq('actor_id', req.user.id);
    } else if (req.user.role === 'student') {
      query = query.eq('actor_id', req.user.id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      logger.error('Get audit logs error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    logger.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllAuditLogs
};
