const supabase = require('../supabase');
const logger = require('pino')();

const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, role')
      .eq('email', email)
      .single();

    if (userError || !user) {
      logger.warn(`OTP attempt for non-existent email: ${email}`);
      return res.json({
        message: 'If this email exists in our system, you will receive an OTP'
      });
    }

    // Email exists, send OTP
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      }
    });

    if (error) {
      logger.error('OTP send error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: 'OTP sent successfully',
      emailExists: true
    });
  } catch (error) {
    logger.error('Send OTP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      return res.status(400).json({
        error: 'Email and OTP token are required'
      });
    }

    // Verify OTP
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    });

    if (error) {
      logger.error('OTP verification error:', error);
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Get user from database BY EMAIL
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      logger.error(`User ${email} not in users table`);
      return res.status(403).json({
        error: 'Access denied. Please contact administrator.'
      });
    }

    // Sync IDs if mismatch
    if (userData.id !== data.user.id) {
      console.log(`🔄 Syncing ID: DB has ${userData.id}, Auth has ${data.user.id}`);

      const { error: updateError } = await supabase
        .from('users')
        .update({ id: data.user.id })
        .eq('email', email);

      if (updateError) {
        logger.error('Failed to sync ID:', updateError);
      } else {
        console.log('✅ IDs synced');
        userData.id = data.user.id; // Update for response
      }
    }

    // Return ALL necessary data
    res.json({
      message: 'Login successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        role: userData.role,
        entryNumber: userData.entry_number,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in,
        expiresAt: data.session.expires_at
      }
    });

  } catch (error) {
    logger.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const { error } = await supabase.auth.admin.signOut(refreshToken);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Logout successful' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getProfile = async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) {
      logger.error('Profile fetch error:', error);
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(profile);
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getSession = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('users')
      .select('id, email, role, entry_number')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return res.status(403).json({
        error: 'User exists but has no role assigned'
      });
    }
    console.log(data)
    res.json({
      user: data
    });
  } catch (err) {
    console.error('getSession error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { sendOTP, verifyOTP, logout, getProfile, getSession };


