const mongoose = require("mongoose");
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      default: () => {
        return uuidv4();
      },
    },
    username:{
      type:String,
      require:true,
    },
    name: {
      type: String,
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
    mobile:{
      type:String,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isOnBoardingCompleted: {
      type: Boolean,
      default: false,
    },
    isActive:{
      type:Boolean,
      default: false,
    }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
