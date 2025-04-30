const express = require('express');
const router = express.Router();
const destinationController = require('../controllers/destinationController');
const gameController = require('../controllers/gameController');
const authController = require('../controllers/authController');
const { authenticate, authenticateAdmin, authRateLimiter } = require('../middlewares/auth');

// Public Routes
router.get('/destinations/random', destinationController.getRandomDestination);

// Game routes
router.post('/game/answer', gameController.submitAnswer);
router.post('/game/challenge', gameController.createChallenge);

// Auth Routes
router.post('/auth/register', authController.register)
router.post('/auth/login', authController.login)
router.get('/auth/me', authenticate, authController.getCurrentUser)

// Admin routes
router.post('/auth/admin', authRateLimiter, authController.getAdminToken);
router.post('/destinations', authenticateAdmin, destinationController.addDestination);

module.exports = router;