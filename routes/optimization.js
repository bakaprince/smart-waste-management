const express = require('express');
const router = express.Router();
const Bin = require('../models/Bin');
const Locality = require('../models/Locality');

// Get optimized collection route for a locality
router.get('/optimize/:localityId', async (req, res) => {
  try {
    const locality = await Locality.findById(req.params.localityId);
    const bins = await Bin.find({ 
      locality: req.params.localityId,
      wasteLevel: { $gte: 70 }
    }).sort({ wasteLevel: -1 });

    if (bins.length === 0) {
      return res.json({ message: 'No bins require collection', route: [] });
    }

    // Simple route optimization - sort by waste level (highest first)
    const optimizedRoute = bins.map((bin, index) => ({
      order: index + 1,
      binId: bin.binId,
      location: bin.location,
      wasteLevel: bin.wasteLevel,
      estimatedTime: index * 15 + 10 // 15 min between bins + 10 min collection
    }));

    const totalDistance = calculateTotalDistance(bins);
    const totalTime = optimizedRoute.length * 15 + 10;

    res.json({
      locality: locality.name,
      totalBins: bins.length,
      totalDistance: `${totalDistance.toFixed(2)} km`,
      estimatedTime: `${totalTime} minutes`,
      route: optimizedRoute
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all localities requiring collection
router.get('/collection-needed', async (req, res) => {
  try {
    const localities = await Locality.find();
    const collectionNeeded = [];

    for (const locality of localities) {
      const bins = await Bin.find({ locality: locality._id });
      const avgWasteLevel = bins.length > 0 
        ? Math.round(bins.reduce((sum, bin) => sum + bin.wasteLevel, 0) / bins.length)
        : 0;

      if (avgWasteLevel >= 70) {
        const highWasteBins = bins.filter(bin => bin.wasteLevel >= 70);
        collectionNeeded.push({
          locality: locality.name,
          avgWasteLevel,
          binsRequiringCollection: highWasteBins.length,
          totalBins: bins.length,
          priority: avgWasteLevel >= 90 ? 'High' : 'Medium'
        });
      }
    }

    // Sort by priority and waste level
    collectionNeeded.sort((a, b) => {
      if (a.priority === 'High' && b.priority !== 'High') return -1;
      if (b.priority === 'High' && a.priority !== 'High') return 1;
      return b.avgWasteLevel - a.avgWasteLevel;
    });

    res.json(collectionNeeded);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function calculateTotalDistance(bins) {
  if (bins.length < 2) return 0;
  
  let totalDistance = 0;
  for (let i = 0; i < bins.length - 1; i++) {
    const dist = getDistance(
      bins[i].location.latitude, bins[i].location.longitude,
      bins[i + 1].location.latitude, bins[i + 1].location.longitude
    );
    totalDistance += dist;
  }
  return totalDistance;
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

module.exports = router;
