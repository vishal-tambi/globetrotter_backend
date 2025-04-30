const Destination = require('../models/Destination');
const User = require('../models/User');
const { createChallengeToken } = require('../utils/auth');

exports.submitAnswer = async (req, res, next) => {
  try {
    const { username, destination, isCorrect } = req.body;
    
    // Update user score
    const user = await User.findOneAndUpdate(
      { username },
      { 
        $inc: { 
          'score.correct': isCorrect ? 1 : 0,
          'score.incorrect': isCorrect ? 0 : 1
        },
        $set: { lastActive: new Date() }
      },
      { new: true, upsert: true }
    );
    
    // Update streak
    await user.updateStreak(isCorrect);
    
    // Get a fun fact for response
    const fact = await Destination.findOne({ name: destination })
      .select('facts')
      .then(doc => {
        const facts = doc?.facts || [];
        return facts[Math.floor(Math.random() * facts.length)]?.text || 
          'This place is full of surprises!';
      });
    
    res.json({
      isCorrect,
      fact,
      score: user.score
    });
  } catch (error) {
    next(error);
  }
};

exports.createChallenge = async (req, res, next) => {
  try {
    const { username } = req.body;
    
    // Create or update user
    const user = await User.findOneAndUpdate(
      { username },
      { $set: { lastActive: new Date() } },
      { new: true, upsert: true }
    );
    
    // Create challenge token
    const challengeId = createChallengeToken(username);
    
    // Save challenge to user
    user.challenges.push({ challengeId });
    await user.save();
    
    res.json({
      challengeId,
      shareUrl: `${process.env.FRONTEND_URL}/challenge/${challengeId}`,
      currentScore: user.score
    });
  } catch (error) {
    next(error);
  }
};