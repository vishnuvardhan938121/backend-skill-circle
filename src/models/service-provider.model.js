const mongoose = require("mongoose");
const { v4: uuidv4 } = require('uuid');

const serviceProviderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      default: () => {
        return uuidv4();
      },
    },
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    mobile:{
      type:Number
    },
    address: {
      type:String,
    },
    street:{
      type:String,
    },
    state:{
      type:String,
      default:"Telangana"
    },
    country:{
      type:String,
      default:"India"
    },
    pinCode:{
      type:Number,
    },
    latitude:{
      type:Number,
    },
    longitude:{
      type:Number
    },
    rating:{
      type:Number,
    },
    profilePhoto: {
      type: String,
    },
    ratingIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Rating",
      },
    ],
    bookingIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
      },
    ],
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isOnboardingCompleted: {
      type: Boolean,
      default: false,
    },
    serviceCategoryId:{
      type: String,
    },
    serviceId:{
      type: String,
    },
    minPrice:{
      type:Number
    },
    maxRating:{
      type:Number
    },
    experienceLevel: {
      type: String,
      enum: ["beginner", "intermediate", "expert"],
    },
  },
  { timestamps: true }
);

const ServiceProvider = mongoose.model(
  "ServiceProvider",
  serviceProviderSchema
);

module.exports = ServiceProvider;
