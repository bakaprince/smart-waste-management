const express = require('express');
const router = express.Router();
const Locality = require('../models/Locality');
const Bin = require('../models/Bin');

// Get all localities with average waste levels
router.get('/', async (req, res) => {
  try {
    const localities = await Locality.find();
    const localitiesWithAvg = await Promise.all(
      localities.map(async (locality) => {
        const bins = await Bin.find({ locality: locality._id });
        const avgWasteLevel = bins.length > 0 
          ? Math.round(bins.reduce((sum, bin) => sum + bin.wasteLevel, 0) / bins.length)
          : 0;
        
        return {
          ...locality.toObject(),
          avgWasteLevel,
          binCount: bins.length
        };
      })
    );
    
    res.json(localitiesWithAvg);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new locality
router.post('/', async (req, res) => {
  try {
    const locality = new Locality(req.body);
    await locality.save();
    res.status(201).json(locality);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get locality details with bins
router.get('/:id', async (req, res) => {
  try {
    const locality = await Locality.findById(req.params.id);
    const bins = await Bin.find({ locality: req.params.id });
    
    res.json({
      ...locality.toObject(),
      bins
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
