const express = require('express');
const router = express.Router();
const destinationController = require('../controllers/destinationController');

// Route to test if backend is working
router.get('/test', (req, res) => {
  res.send('API is working!');
});

// Get a random destination with clues
router.get('/destinations/random', destinationController.getRandomDestination);

// Add a new destination (admin use)
router.post('/destinations', destinationController.addDestination);

module.exports = router;
