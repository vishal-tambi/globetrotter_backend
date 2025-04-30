const mongoose = require('mongoose');

const clueSchema = new mongoose.Schema({
  text: { type: String, required: true },
  difficulty: { type: Number, min: 1, max: 3, default: 2 }
});

const factSchema = new mongoose.Schema({
  text: { type: String, required: true },
  category: { type: String, enum: ['history', 'culture', 'nature', 'fun'], default: 'fun' }
});

const destinationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  country: { type: String, required: true },
  continent: { type: String, required: true },
  clues: [clueSchema],
  facts: [factSchema],
  imageUrl: { type: String },
  verified: { type: Boolean, default: false },
  popularity: { type: Number, min: 1, max: 5, default: 3 },
  lastUpdated: { type: Date, default: Date.now }
});

// Add text index for search
destinationSchema.index({ name: 'text', country: 'text', continent: 'text' });


// Add these indexes for performance optimization
destinationSchema.index({ verified: 1, lastUpdated: -1 }); // For getting random verified destinations
destinationSchema.index({ continent: 1, popularity: -1 }); // For future continent-based queries
destinationSchema.index({ country: 1, name: 1 }); // For country-specific lookups


// Static method to get random destinations
destinationSchema.statics.getRandomDestinations = function(count = 1, excludeId = null) {
  const matchStage = excludeId ? { $match: { _id: { $ne: excludeId } } } : { $match: {} };
  
  return this.aggregate([
    matchStage,
    { $sample: { size: count } },
    { $project: { name: 1, country: 1, continent: 1, imageUrl: 1 } }
  ]);
};

module.exports = mongoose.model('Destination', destinationSchema);