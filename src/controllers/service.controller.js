const Joi = require("joi");

const HttpStatusConstant = require("../constants/http-message.constant");
const HttpStatusCode = require("../constants/http-code.constant");
const ResponseMessageConstant = require("../constants/response-message.constant");
const CommonConstant = require("../constants/common.constant");
const ErrorLogConstant = require("../constants/error-log.constant");

const generateUUID = require("../helpers/uuid.helper");

const { Service, ServiceCategory } = require("../models/service.model");

const imageController = require("./image.controller");

exports.handleCreateService = async (req, res) => {
  try {
    const { serviceName, categoryId, image } = req.body;

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
      const imageName = generateUUID();

      if (req.file) {
        console.log("hii");
      }
      const imageUrl = await imageController.uploadImageToS3(
        imageName,
        req.file
      );

      if (imageUrl == null) {
        return res.status(HttpStatusCode.InternalServerError).json({
          status: HttpStatusConstant.ERROR,
          code: HttpStatusCode.InternalServerError,
          message: ResponseMessageConstant.IMAGE_UPLOAD_FAILED,
        });
      }

      const newService = await Service.create({
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
  } catch (error) {
    console.log(
      ErrorLogConstant.serviceController.handleCreateServiceErrorLog,
      error.message
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
          from: "serviceproviders",
          localField: "serviceId",
          foreignField: "serviceId",
          as: "providers",
        },
      },

      {
        $match: {
          "providers.0": { $exists: true },
        },
      },

      {
        $lookup: {
          from: "servicecategories",
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
              id: "$_id",
              serviceId: "$serviceId",
              name: "$serviceName",
              rating: "$rating",
              category: "$category.categoryName",
              image: "$imageUrl",
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
      error.message
    );
    res.status(HttpStatusCode.InternalServerError).json({
      status: HttpStatusConstant.ERROR,
      code: HttpStatusCode.InternalServerError,
    });
  }
};

exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.find()
      .populate("categoryId", "categoryName")
      .exec();
    const categories = await ServiceCategory.find();

    const serviceResponse = {
      services: services.map((service) => ({
        serviceId: service.serviceId,
        serviceName: service.serviceName,
      })),
      categories: categories.map((category) => ({
        categoryId: category.categoryId,
        categoryName: category.categoryName,
      })),
    };

    return res.status(HttpStatusCode.Ok).json({
      status: HttpStatusConstant.OK,
      code: HttpStatusCode.Ok,
      data: serviceResponse,
    });
  } catch (error) {
    console.log(
      ErrorLogConstant.serviceController.handleGetAllServicesErrorLog,
      error.message
    );
    res.status(HttpStatusCode.InternalServerError).json({
      status: HttpStatusConstant.ERROR,
      code: HttpStatusCode.InternalServerError,
    });
  }
};
