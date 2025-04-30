const Challenge = require('../models/Challenge');
const User = require('../models/User');

exports.createChallenge = async (req, res, next) => {
  try {
    const { destinationId } = req.body;
    const userId = req.userId; // From auth middleware

    // Create challenge
    const challenge = new Challenge({
      creator: userId,
      destination: destinationId,
      participants: [{
        user: userId,
        score: { correct: 0, incorrect: 0 }
      }],
      status: 'active'
    });

    await challenge.save();

    // Add challenge to user's challenges
    await User.findByIdAndUpdate(userId, {
      $push: { challenges: challenge._id }
    });

    res.json(new ApiResponse(201, {
      challengeId: challenge._id,
      shareUrl: `${process.env.FRONTEND_URL}/challenge/${challenge._id}`
    }));

  } catch (error) {
    next(error);
  }
};

exports.getChallenge = async (req, res, next) => {
  try {
    const challenge = await Challenge.findById(req.params.id)
      .populate('creator', 'username')
      .populate('destination');

    if (!challenge) {
      throw new ApiError(404, 'Challenge not found');
    }

    res.json(new ApiResponse(200, { challenge }));
  } catch (error) {
    next(error);
  }
};

exports.submitChallengeAnswer = async (req, res, next) => {
  try {
    const { isCorrect, answer } = req.body;
    const userId = req.userId;
    const challengeId = req.params.id;

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      throw new ApiError(404, 'Challenge not found');
    }

    // Update participant's score
    const participantIndex = challenge.participants.findIndex(
      p => p.user.toString() === userId.toString()
    );

    if (participantIndex === -1) {
      // New participant
      challenge.participants.push({
        user: userId,
        score: {
          correct: isCorrect ? 1 : 0,
          incorrect: isCorrect ? 0 : 1
        },
        answer
      });
    } else {
      // Existing participant
      challenge.participants[participantIndex].score.correct += isCorrect ? 1 : 0;
      challenge.participants[participantIndex].score.incorrect += isCorrect ? 0 : 1;
      challenge.participants[participantIndex].answer = answer;
    }

    await challenge.save();
    res.json(new ApiResponse(200, { challenge }));
  } catch (error) {
    next(error);
  }
};