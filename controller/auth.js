const User = require('../model/user');
const bcrypt = require('bcryptjs');
const { createToken } = require('../utils/jwt');

// Signup
exports.signup = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Missing details', success: false });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists', success: false });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({ name, email, password: hashedPassword });

    const token = createToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });

    return res.json({ success: true, message: 'Account created', user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    return res.status(500).json({ message: err.message, success: false });
  }
};

// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required', success: false });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User does not exist', success: false });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(400).json({ message: 'Invalid password', success: false });

    const token = createToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });

    return res.json({ success: true, message: 'Login successful', user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    return res.status(500).json({ message: err.message, success: false });
  }
};

// Logout
exports.logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    path: '/',
  });
  res.json({ success: true, message: 'Logged out successfully' });
};

// Verify
exports.verifyUser = async (req, res) => {
  const userId = req.user.id;
  const user = await User.findById(userId).select('-password');
  if (!user) return res.status(401).json({ message: 'Unauthorized', success: false });
  res.json({ user });
};
