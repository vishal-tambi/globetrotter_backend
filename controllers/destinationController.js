const Destination = require('../models/Destination');
const { generateTravelClues, validateDestination } = require('../services/geminiService');

// Get random destination with clues
exports.getRandomDestination = async (req, res, next) => {
  try {
    const [destination] = await Destination.aggregate([
      { $match: { verified: true } },
      { $sample: { size: 1 } },
      { 
        $project: { 
          name: 1,
        country: 1,
          clues: { $slice: ['$clues', 2] }, // Get 2 random clues
          facts: { $slice: ['$facts', 1] } // Get 1 random fact
        } 
      }
    ]);

    if (!destination) {
      return res.status(404).json({ error: 'No destinations found' });
    }

    // Get 3 other random destinations for options
    const options = await Destination.getRandomDestinations(3, destination._id);
    const allOptions = [
      { name: destination.name, country: destination.country },
      ...options
    ].sort(() => Math.random() - 0.5); // Shuffle options

    res.json({
      question: {
        clues: destination.clues,
        fact: destination.facts[0] // For incorrect answer
      },
      options: allOptions,
      correctAnswer: destination.name
    });
  } catch (error) {
    next(error);
  }
};

// Add new destination (admin function)
exports.addDestination = async (req, res, next) => {
  try {
    const { name, country, continent } = req.body;
    
    // Validate with Gemini
    const isValid = await validateDestination(name);
    if (!isValid) {
      return res.status(400).json({ error: 'Not a well-known destination' });
    }
    
    // Generate clues and facts
    const { clues, facts } = await generateTravelClues(name);
    
    const newDestination = new Destination({
      name,
      country,
      continent,
      clues: clues.map(text => ({ text })),
      facts: facts.map(text => ({ text })),
      verified: true
    });
    
    await newDestination.save();
    res.status(201).json(newDestination);
  } catch (error) {
    next(error);
  }
};

// Other controller methods would go here...