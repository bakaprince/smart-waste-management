const express = require('express');
const router = express.Router();
const Bin = require('../models/Bin');

// Get all bins
router.get('/', async (req, res) => {
  try {
    const bins = await Bin.find().populate('locality');
    res.json(bins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get bins by locality
router.get('/locality/:localityId', async (req, res) => {
  try {
    const bins = await Bin.find({ locality: req.params.localityId });
    res.json(bins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update bin waste level (IoT sensor simulation)
router.put('/:binId/level', async (req, res) => {
  try {
    const { wasteLevel } = req.body;
    const bin = await Bin.findOneAndUpdate(
      { binId: req.params.binId },
      { 
        wasteLevel,
        lastUpdated: new Date(),
        status: wasteLevel >= 90 ? 'full' : 'active'
      },
      { new: true }
    );
    
    if (!bin) {
      return res.status(404).json({ error: 'Bin not found' });
    }
    
    res.json(bin);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new bin
router.post('/', async (req, res) => {
  try {
    const bin = new Bin(req.body);
    await bin.save();
    res.status(201).json(bin);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
