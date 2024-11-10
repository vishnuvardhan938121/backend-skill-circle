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
const {ServiceCategory} = require("../models/service.model");

exports.handleCreateServiceCategory = async (req, res) => {
    try {
        const serviceCategoryValidation = Joi.object({
            categoryName: Joi.string().required(),
        });

        const { error } = serviceCategoryValidation.validate(req.body);

        if (error) {
            return res.status(HttpStatusCode.BadRequest).json({
                status: HttpStatusConstant.BAD_REQUEST,
                code: HttpStatusCode.BadRequest,
                message: error.details[0].message.replace(/"/g, ""),
            });
        } else {
            const { categoryName } = req.body;

            const isServiceCategoryExists = await ServiceCategory.exists({
                categoryName: categoryName,
            });

            if (isServiceCategoryExists) {
                return res.status(HttpStatusCode.Conflict).json({
                    status: HttpStatusConstant.CONFLICT,
                    code: HttpStatusCode.Conflict,
                    message: ResponseMessageConstant.SERVICE_CATEGORY_ALREADY_EXISTS, 
                });
            } else {
                
                const categoryId = generateUUID(); 

                const newServiceCategory = await ServiceCategory.create({
                    categoryId,
                    categoryName: categoryName,
                });
                return res.status(HttpStatusCode.Created).json({
                    status: HttpStatusConstant.CREATED,
                    code: HttpStatusCode.Created,
                    data: newServiceCategory,
                });
            }
        }
    } catch (error) {
        console.log(
            ErrorLogConstant.serviceCategoryController.handleCreateServiceCategoryErrorLog, 
            error.message,
        );
        res.status(HttpStatusCode.InternalServerError).json({
            status: HttpStatusConstant.ERROR,
            code: HttpStatusCode.InternalServerError,
        });
    }
};

exports.handleUpdateServiceCategory = async (req, res) => {
    try {
        const { categoryId } = req.params; 

        if (!categoryId) {
            return res.status(HttpStatusCode.NotFound).json({
                status: HttpStatusConstant.NOT_FOUND,
                code: HttpStatusCode.NotFound,
                message: ResponseMessageConstant.SERVICE_CATEGORY_ID_REQUIRED, 
            });
        } else {
            const isServiceCategoryExists = await ServiceCategory.exists({
                categoryId: categoryId, 
            });

            if (!isServiceCategoryExists) {
                return res.status(HttpStatusCode.NotFound).json({
                    status: HttpStatusConstant.NOT_FOUND,
                    code: HttpStatusCode.NotFound,
                    message: ResponseMessageConstant.SERVICE_CATEGORY_NOT_FOUND, 
                });
            } else {
                const { categoryName } = req.body;

                const updatedServiceCategoryResponse = await ServiceCategory.findOneAndUpdate(
                    { categoryId: categoryId }, 
                    {
                        $set: {
                            categoryName: categoryName,
                        },
                    },
                    { new: true } 
                );
                return res.status(HttpStatusCode.Ok).json({
                    status: HttpStatusConstant.OK,
                    code: HttpStatusCode.Ok,
                    data: updatedServiceCategoryResponse,
                });
            }
        }
    } catch (error) {
        console.log(
            ErrorLogConstant.serviceCategoryController.handleUpdateServiceCategoryErrorLog, 
            error.message,
        );
        res.status(HttpStatusCode.InternalServerError).json({
            status: HttpStatusConstant.ERROR,
            code: HttpStatusCode.InternalServerError,
        });
    }
};
