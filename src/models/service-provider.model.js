const mongoose = require("mongoose");

const serviceProviderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
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
    address: {
      hNo: String,
      street: String,
      area: String,
      state: String,
      country: String,
      zipCode: String,
      latitude: Number,
      longitude: Number,
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
    servicesOffered: [
      {
        categoryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ServiceCategory",
        },
        serviceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Service",
        },
        pricingRange: {
          min: {
            type: Number,
          },
          max: {
            type: Number,
          },
        },
      },
    ],
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
