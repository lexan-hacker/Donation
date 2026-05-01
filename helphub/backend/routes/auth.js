/**
 * Auth Routes
 * Handles user authentication endpoints
 */

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
} = require('../controllers/authController');

// Validation rules
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const profileValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
];

const passwordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
];

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginLimiter, loginValidation, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, profileValidation, updateProfile);
router.put('/change-password', protect, passwordValidation, changePassword);

module.exports = router;
