const supabase = require('../supabase');
const logger = require('pino')();

const getAllDepartments = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      logger.error('Get departments error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    logger.error('Get departments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createDepartment = async (req, res) => {
  try {
    const { name, code } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Department name is required' });
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data, error } = await supabase
      .from('departments')
      .insert([{ name, code }])
      .select()
      .single();

    if (error) {
      logger.error('Create department error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json(data);
  } catch (error) {
    logger.error('Create department error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllDepartments,
  createDepartment
};
