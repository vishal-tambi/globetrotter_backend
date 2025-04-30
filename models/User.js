const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  score: {
    correct: { type: Number, default: 0 },
    incorrect: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    maxStreak: { type: Number, default: 0 }
  },
  challenges: [{
    // challengeId: { type: String }, i have removed unique, becasue it was causing issues with mmultiple challenges
    createdAt: { type: Date, default: Date.now },
    participants: [{
      username: String,
      score: { correct: Number, incorrect: Number }
    }]
  }],
  lastActive: { type: Date, default: Date.now }
});

// ✅ Hash the password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

// ✅ Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
