const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
const { sendSMSAlert, sendEmailAlert } = require('./services/notifications');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/waste-management');

// Models
const Bin = require('./models/Bin');
const Locality = require('./models/Locality');
const Alert = require('./models/Alert');

// Routes
app.use('/api/bins', require('./routes/bins'));
app.use('/api/localities', require('./routes/localities'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/routes', require('./routes/optimization'));

// Check localities every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  console.log('Checking locality waste levels...');
  const localities = await Locality.find();
  
  for (const locality of localities) {
    const avgWasteLevel = await calculateLocalityAverage(locality._id);
    
    if (avgWasteLevel >= 70 && !locality.alertSent) {
      await sendMunicipalAlert(locality, avgWasteLevel);
      locality.alertSent = true;
      await locality.save();
    } else if (avgWasteLevel < 70) {
      locality.alertSent = false;
      await locality.save();
    }
  }
});

async function calculateLocalityAverage(localityId) {
  const bins = await Bin.find({ locality: localityId });
  if (bins.length === 0) return 0;
  
  const totalWaste = bins.reduce((sum, bin) => sum + bin.wasteLevel, 0);
  return Math.round(totalWaste / bins.length);
}

async function sendMunicipalAlert(locality, avgLevel) {
  const alert = new Alert({
    locality: locality._id,
    message: `Locality ${locality.name} needs waste collection - Average: ${avgLevel}%`,
    avgWasteLevel: avgLevel,
    status: 'pending'
  });
  
  await alert.save();
  console.log(`Alert sent for ${locality.name}: ${avgLevel}% full`);
  
  // Send SMS and Email notifications
  await Promise.all([
    sendSMSAlert(locality, avgLevel),
    sendEmailAlert(locality, avgLevel)
  ]);
}

// Manual trigger for testing
app.post('/api/test-alert/:localityId', async (req, res) => {
  try {
    const locality = await Locality.findById(req.params.localityId);
    const avgLevel = await calculateLocalityAverage(locality._id);
    await sendMunicipalAlert(locality, avgLevel);
    res.json({ message: 'Test alert sent', avgLevel });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
