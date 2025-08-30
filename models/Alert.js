const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  locality: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Locality',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  avgWasteLevel: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'acknowledged', 'completed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
});

module.exports = mongoose.model('Alert', alertSchema);
