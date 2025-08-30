const mongoose = require('mongoose');

const localitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  boundaries: {
    type: [[Number]], // Array of [lat, lng] coordinates
    required: true
  },
  alertSent: {
    type: Boolean,
    default: false
  },
  municipalContact: {
    phone: String,
    email: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Locality', localitySchema);
