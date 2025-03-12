const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  register,
  login,
  adminLogin,
  getProfile,
  updateProfile
} = require('../controllers/authController');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/admin/login', adminLogin);

// Protected routes
router.get('/profile', auth, getProfile);
router.patch('/profile', auth, updateProfile);

module.exports = router; 