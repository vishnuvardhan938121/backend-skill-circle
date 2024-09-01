const Joi = require("joi");

// Importing Constants
const HttpStatusConstant = require("../constants/http-message.constant");
const HttpStatusCode = require("../constants/http-code.constant");
const ResponseMessageConstant = require("../constants/response-message.constant");
const CommonConstant = require("../constants/common.constant");
const ErrorLogConstant = require("../constants/error-log.constant");

// Importing Helpers
const generateUUID = require("../helpers/uuid.helper");

// Importing models
const {Service} = require("../models/service.model");

// Importing Controllers
const imageController = require("./image.controller");

exports.handleCreateService = async (req, res) => {
    try {
        const serviceValidation = Joi.object({
            serviceName: Joi.string().required(),
            categoryId: Joi.string().required(), 
            
        });

        const { error } = serviceValidation.validate(req.body);

        if (error) {
            return res.status(HttpStatusCode.BadRequest).json({
                status: HttpStatusConstant.BAD_REQUEST,
                code: HttpStatusCode.BadRequest,
                message: error.details[0].message.replace(/"/g, ""),
            });
        } else {
            const { serviceName, categoryId, image } = req.body; // Adjust based on your actual service fields

            const isServiceExists = await Service.findOne({
                categoryId,
                serviceName,
            });

            if (isServiceExists) {
                return res.status(HttpStatusCode.Conflict).json({
                    status: HttpStatusConstant.CONFLICT,
                    code: HttpStatusCode.Conflict,
                    message: ResponseMessageConstant.SERVICE_ALREADY_EXISTS, 
                });
            } else {
                const serviceId = generateUUID();

                const imageName = generateUUID();

                const imageUrl = await imageController.uploadImageToS3(
                    imageName,
                    req.file,
                );

                if (imageUrl == null) {
                    return res.status(HttpStatusCode.InternalServerError).json({
                        status: HttpStatusConstant.ERROR,
                        code: HttpStatusCode.InternalServerError,
                        message: ResponseMessageConstant.IMAGE_UPLOAD_FAILED,
                    });
                }

                const newService = await Service.create({
                    serviceId,
                    serviceName: serviceName,
                    categoryId,
                    imageUrl,
                });
                return res.status(HttpStatusCode.Created).json({
                    status: HttpStatusConstant.CREATED,
                    code: HttpStatusCode.Created,
                    data: newService,
                });
            }
        }
    } catch (error) {
        console.log(
            ErrorLogConstant.serviceController.handleCreateServiceErrorLog, 
            error.message,
        );
        res.status(HttpStatusCode.InternalServerError).json({
            status: HttpStatusConstant.ERROR,
            code: HttpStatusCode.InternalServerError,
        });
    }
};

exports.handleGetAllServices = async (req, res) => {
    try {
        const { searchTerm = "" } = req.query;

        const serviceResponse = await Service.aggregate([
            {
                $match: {
                    serviceName: { $regex: searchTerm, $options: "i" },
                },
            },
            {
                $lookup: {
                    from: "ServiceCategory", 
                    localField: "categoryId",
                    foreignField: "categoryId",
                    as: "category",
                },
            },
            {
                $unwind: "$category", 
            },
            {
                $group: {
                    _id: "$category.categoryName",
                    services: {
                        $push: {
                            _id: "$_id",
                            serviceId: "$serviceId",
                            serviceName: "$serviceName",
                            categoryId: "$categoryId",
                            categoryName: "$category.categoryName",
                            imageUrl: "$imageUrl", 
                            createdAt: "$createdAt",
                            updatedAt: "$updatedAt",
                            __v: "$__v",
                        },
                    },
                },
            },
        ]);

        return res.status(HttpStatusCode.Ok).json({
            status: HttpStatusConstant.OK,
            code: HttpStatusCode.Ok,
            data: serviceResponse,
        });
    } catch (error) {
        console.log(
            ErrorLogConstant.serviceController.handleGetAllServicesErrorLog,
            error.message,
        );
        res.status(HttpStatusCode.InternalServerError).json({
            status: HttpStatusConstant.ERROR,
            code: HttpStatusCode.InternalServerError,
        });
    }
};
