const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  score: {
    correct: { type: Number, default: 0 },
    incorrect: { type: Number, default: 0 }
  },
  answer: String
}, { timestamps: true });

const challengeSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Destination' },
  participants: [participantSchema],
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active'
  }
}, { timestamps: true });

module.exports = mongoose.model('Challenge', challengeSchema);