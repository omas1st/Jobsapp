const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  email: { type: String, required: true },
  personalDetails: {
    fullName: String,
    email: String,
    whatsapp: String,
    contact: String,
    country: String,
  },
  jobDetails: {
    companyNames: String,
    companyLocation: String,
    position: String,
    jobType: String,
  },
  status: { type: String, default: 'Pending' },
  adminMessage: String,
  messages: [{
    content: String,
    timestamp: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('Application', applicationSchema);
