const mongoose = require('mongoose');

const binSchema = new mongoose.Schema({
  binId: {
    type: String,
    required: true,
    unique: true
  },
  locality: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Locality',
    required: true
  },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  wasteLevel: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'full'],
    default: 'active'
  }
});

module.exports = mongoose.model('Bin', binSchema);
