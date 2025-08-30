const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/waste-management');

// Models
const Bin = require('./models/Bin');
const Locality = require('./models/Locality');
const Alert = require('./models/Alert');

// Routes
app.use('/api/bins', require('./routes/bins'));
app.use('/api/localities', require('./routes/localities'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/routes', require('./routes/optimization'));

// Demo alert function (without external services)
async function sendDemoAlert(locality, avgLevel) {
  const alert = new Alert({
    locality: locality._id,
    message: `Locality ${locality.name} needs waste collection - Average: ${avgLevel}%`,
    avgWasteLevel: avgLevel,
    status: 'pending'
  });
  
  await alert.save();
  console.log(`🚨 DEMO ALERT: ${locality.name} is ${avgLevel}% full - Collection required!`);
  console.log(`📧 Email would be sent to: ${locality.municipalContact?.email || 'municipal@city.gov'}`);
  console.log(`📱 SMS would be sent to: ${locality.municipalContact?.phone || '+1234567890'}`);
  return alert;
}

// Manual trigger for demo
app.post('/api/demo-alert/:localityId', async (req, res) => {
  try {
    const locality = await Locality.findById(req.params.localityId);
    const bins = await Bin.find({ locality: locality._id });
    const avgLevel = bins.length > 0 
      ? Math.round(bins.reduce((sum, bin) => sum + bin.wasteLevel, 0) / bins.length)
      : 0;
    
    const alert = await sendDemoAlert(locality, avgLevel);
    res.json({ 
      message: 'Demo alert triggered!', 
      locality: locality.name,
      avgLevel,
      alert: alert._id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Simulate IoT sensor update
app.post('/api/demo/simulate-high-waste', async (req, res) => {
  try {
    // Find a random bin and set it to high waste level
    const bins = await Bin.find().limit(3);
    const updates = [];
    
    for (const bin of bins) {
      const newLevel = Math.floor(Math.random() * 30) + 70; // 70-100%
      bin.wasteLevel = newLevel;
      bin.lastUpdated = new Date();
      await bin.save();
      updates.push({ binId: bin.binId, newLevel });
    }
    
    res.json({ 
      message: 'Simulated high waste levels!',
      updates
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Smart Waste Management Demo Server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔧 API: http://localhost:${PORT}/api/localities`);
});
