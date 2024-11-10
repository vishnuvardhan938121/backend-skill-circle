const Joi = require("joi");

const HttpStatusConstant = require("../constants/http-message.constant");
const HttpStatusCode = require("../constants/http-code.constant");
const ResponseMessageConstant = require("../constants/response-message.constant");
const ErrorLogConstant = require("../constants/error-log.constant");

const generateUUID = require("../helpers/uuid.helper");

const Rating = require("../models/rating.model");
const Booking = require("../models/booking.model");

exports.createReview = async (req, res) => {
  try {
    const {
      serviceProviderId,
      bookingId,
      qualityOfWork,
      communication,
      timeliness,
      valueForMoney,
      overallComment,
    } = req.body;

    const reviewValidation = Joi.object({
      serviceProviderId: Joi.string().required(),
      bookingId: Joi.string().required(),
      qualityOfWork: Joi.number().min(1).max(5).required(),
      communication: Joi.number().min(1).max(5).required(),
      timeliness: Joi.number().min(1).max(5).required(),
      valueForMoney: Joi.number().min(1).max(5).required(),
      overallComment: Joi.string().allow(""),
    });

    const { error } = reviewValidation.validate(req.body);

    if (error) {
      return res.status(HttpStatusCode.BadRequest).json({
        status: HttpStatusConstant.BAD_REQUEST,
        code: HttpStatusCode.BadRequest,
        message: error.details[0].message.replace(/"/g, ""),
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(HttpStatusCode.NotFound).json({
        status: HttpStatusConstant.NOT_FOUND,
        code: HttpStatusCode.NotFound,
        message: ResponseMessageConstant.BOOKING_NOT_FOUND,
      });
    }

    const existingReview = await Rating.findOne({
      bookingId: bookingId,
      userId: req.user.userId,
    });
    if (existingReview) {
      return res.status(HttpStatusCode.Conflict).json({
        status: HttpStatusConstant.CONFLICT,
        code: HttpStatusCode.Conflict,
        message: ResponseMessageConstant.REVIEW_ALREADY_EXISTS,
      });
    }

    const newReview = await Rating.create({
      ratingId: generateUUID(),
      userId: req.user.userId,
      serviceProviderId: serviceProviderId,
      bookingId: bookingId,
      qualityOfWork,
      communication,
      timeliness,
      valueForMoney,
      overallComment,
    });

    res.status(HttpStatusCode.Created).json({
      status: HttpStatusConstant.CREATED,
      code: HttpStatusCode.Created,
      message: ResponseMessageConstant.REVIEW_CREATED,
    });
  } catch (error) {
    console.error(
      ErrorLogConstant.reviewController.createReviewErrorLog,
      error.message
    );
    res.status(HttpStatusCode.InternalServerError).json({
      status: HttpStatusConstant.ERROR,
      code: HttpStatusCode.InternalServerError,
    });
  }
};

