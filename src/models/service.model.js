const mongoose = require("mongoose");
const uuid = require("uuid").v4;

// Service Category Schema
const serviceCategorySchema = new mongoose.Schema(
    {
        categoryId: { 
            type: String,
            unique: true,
        },
        categoryName: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

const ServiceCategory = mongoose.model("ServiceCategory", serviceCategorySchema);

// Service Schema
const serviceSchema = new mongoose.Schema(
    {
        serviceId: {
            type: String,
            unique: true,
            default: () => {
                return uuid(); 
              },
        },
        serviceName: {
            type: String,
            required: true,
        },
        categoryId: { 
            type: String,
            
            required: true
        },
        rating:{
            type:Number,
            min:1,
            max:5,
            default:1
        },
        imageUrl: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

const Service = mongoose.model("Service", serviceSchema);

module.exports = { Service, ServiceCategory };