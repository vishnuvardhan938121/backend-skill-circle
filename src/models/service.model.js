const mongoose = require("mongoose");

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
        },
        serviceName: {
            type: String,
            required: true,
        },
        categoryId: { 
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ServiceCategory',
            required: true
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