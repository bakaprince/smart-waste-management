const mongoose = require('mongoose');
const Locality = require('./models/Locality');
const Bin = require('./models/Bin');

mongoose.connect('mongodb://localhost:27017/waste-management');

async function seedData() {
  try {
    // Clear existing data
    await Locality.deleteMany({});
    await Bin.deleteMany({});

    // Create sample localities
    const localities = await Locality.create([
      {
        name: 'Downtown',
        city: 'Mumbai',
        boundaries: [[19.0760, 72.8777], [19.0860, 72.8877], [19.0760, 72.8977]],
        municipalContact: { phone: '+919876543210', email: 'downtown@mumbai.gov' }
      },
      {
        name: 'Bandra West',
        city: 'Mumbai',
        boundaries: [[19.0596, 72.8295], [19.0696, 72.8395], [19.0596, 72.8495]],
        municipalContact: { phone: '+919876543211', email: 'bandra@mumbai.gov' }
      },
      {
        name: 'Andheri East',
        city: 'Mumbai',
        boundaries: [[19.1136, 72.8697], [19.1236, 72.8797], [19.1136, 72.8897]],
        municipalContact: { phone: '+919876543212', email: 'andheri@mumbai.gov' }
      }
    ]);

    // Create sample bins for each locality
    const bins = [];
    localities.forEach((locality, localityIndex) => {
      for (let i = 1; i <= 5; i++) {
        bins.push({
          binId: `BIN-${locality.name.toUpperCase()}-${i.toString().padStart(3, '0')}`,
          locality: locality._id,
          location: {
            latitude: locality.boundaries[0][0] + (Math.random() * 0.01),
            longitude: locality.boundaries[0][1] + (Math.random() * 0.01)
          },
          wasteLevel: Math.floor(Math.random() * 100),
          status: 'active'
        });
      }
    });

    await Bin.create(bins);

    console.log('Sample data created successfully!');
    console.log(`Created ${localities.length} localities and ${bins.length} bins`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
