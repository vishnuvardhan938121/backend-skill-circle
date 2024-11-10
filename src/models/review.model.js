const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema({
  ratingId: {
    type: String, 
    required: true,
    unique: true,
    default: () => {
      return uuidv4(); 
    },
  },
  userId: {
    type: String, 
    required: true,
    ref: 'User' 
  },
  serviceProviderId: {
    type: String, 
    required: true,
    ref: 'ServiceProvider' 
  },
  bookingId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Booking',
    required: true
  },
  qualityOfWork: { type: Number, min: 1, max: 5, required: true },
  communication: { type: Number, min: 1, max: 5, required: true },
  timeliness: { type: Number, min: 1, max: 5, required: true },
  valueForMoney: { type: Number, min: 1, max: 5, required: true },
  overallComment: String,
  createdAt: { type: Date, default: Date.now }
});

const Rating = mongoose.model('Rating', ratingSchema);

module.exports = Rating;