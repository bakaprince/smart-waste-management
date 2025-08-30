const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');

// Get all alerts
router.get('/', async (req, res) => {
  try {
    const alerts = await Alert.find()
      .populate('locality')
      .sort({ createdAt: -1 });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update alert status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        completedAt: status === 'completed' ? new Date() : undefined
      },
      { new: true }
    ).populate('locality');
    
    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
