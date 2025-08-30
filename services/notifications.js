const twilio = require('twilio');
const nodemailer = require('nodemailer');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Email transporter
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendSMSAlert(locality, avgLevel) {
  try {
    if (!locality.municipalContact?.phone) return;
    
    const message = await client.messages.create({
      body: `🚨 WASTE ALERT: ${locality.name} locality is ${avgLevel}% full. Immediate collection required. Location: ${locality.city}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: locality.municipalContact.phone
    });
    
    console.log(`SMS sent to ${locality.municipalContact.phone}: ${message.sid}`);
    return message;
  } catch (error) {
    console.error('SMS Error:', error.message);
  }
}

async function sendEmailAlert(locality, avgLevel) {
  try {
    if (!locality.municipalContact?.email) return;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: locality.municipalContact.email,
      subject: `Urgent: Waste Collection Required - ${locality.name}`,
      html: `
        <h2>🚨 Waste Collection Alert</h2>
        <p><strong>Locality:</strong> ${locality.name}, ${locality.city}</p>
        <p><strong>Average Waste Level:</strong> ${avgLevel}%</p>
        <p><strong>Status:</strong> Collection Required</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <hr>
        <p>Please dispatch collection team immediately.</p>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${locality.municipalContact.email}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Email Error:', error.message);
  }
}

module.exports = { sendSMSAlert, sendEmailAlert };
