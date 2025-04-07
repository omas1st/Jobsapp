// models/Setting.js
const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  chat: {
    whatsapp: { type: String, default: "12296726676" },
    email: { type: String, default: "Omas7th@gmail.com" }
  },
  informationContent: [{
    title: String,
    content: String
  }]
});

module.exports = mongoose.model('Setting', settingSchema);
