import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const adminAuth = async (req, res, next) => {
  try {
    console.log('🔐 Admin auth middleware called');
    console.log('Headers:', req.headers.authorization);

    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No valid Bearer token');
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token decoded:', decoded);

    // Find user
    const user = await User.findById(decoded.id);

    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.role !== 'admin') {
      console.log('❌ User is not admin:', user.role);
      return res.status(403).json({ message: 'Admin access required' });
    }

    req.user = user;
    console.log('✅ Admin authenticated:', user.email);
    next();
  } catch (error) {
    console.error('❌ Admin auth error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

export default adminAuth;