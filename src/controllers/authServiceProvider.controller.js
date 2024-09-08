const Joi = require("joi");
const bcrypt = require("bcryptjs");

// Importing Models
const ServiceProvider = require("../models/service-provider.model");
const jwtToken = require("../models/jwt-token.model");
const verificationToken = require("../models/verification-token.model");
const PasswordResetToken = require("../models/password-reset-token.model");

// Importing Constants
const HttpStatusConstant = require("../constants/http-message.constant");
const HttpStatusCode = require("../constants/http-code.constant");
const ResponseMessageConstant = require("../constants/response-message.constant");
const CommonConstant = require("../constants/common.constant");
const ErrorLogConstant = require("../constants/error-log.constant");

// Importing Helpers
const generateUUID = require("../helpers/uuid.helper");
const { signToken, verifyToken } = require("../helpers/jwt.helper");
const getSkillCircleSignature = require("../helpers/cookie.helper");

// Importing Controllers
const handleSendEmail = require("./email.controller");

// Importing Utils
const emailTemplates = require("../utils/emailTemplates");

exports.handleRegister = async (req, res) => {
    try {
      const { username, email, password } = req.body;
  
      const userValidation = Joi.object({
        username: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().required(),
      });
  
      const { error } = userValidation.validate(req.body);
  
      if (error) {
        return res.status(HttpStatusCode.BadRequest).json({
          status: HttpStatusConstant.BAD_REQUEST,
          code: HttpStatusCode.BadRequest,
          message: error.details[0].message.replace(/"/g, ""),
        });
      }
      const ServiceProvider = await ServiceProvider.findOne({
        email,
      });
  
      if (ServiceProvider) {
        return res.status(HttpStatusCode.Conflict).json({
          status: HttpStatusConstant.CONFLICT,
          code: HttpStatusCode.Conflict,
          message: ResponseMessageConstant.USER_ALREADY_EXISTS,
        });
      } else {
        const encryptedPassword = await bcrypt.hash(password, 10);
  
        const newUser = await ServiceProvider.create({
          username,
          email,
          password: encryptedPassword,
        });
  
        res.status(HttpStatusCode.Created).json({
          status: HttpStatusConstant.CREATED,
          code: HttpStatusCode.Created,
          message: ResponseMessageConstant.SERVICE_PROVIDER_CREATED,
        });
      }
    } catch (error) {
      console.log(
        ErrorLogConstant.authServiceProviderController.handleRegisterErrorLog,
        error.message
      );
      res.status(HttpStatusCode.InternalServerError).json({
        status: HttpStatusConstant.ERROR,
        code: HttpStatusCode.InternalServerError,
      });
    }
  };

  exports.handleLogin = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      const userValidation = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
      });
  
      const { error } = userValidation.validate(req.body);
  
      if (error) {
        return res.status(HttpStatusCode.BadRequest).json({
          status: HttpStatusConstant.BAD_REQUEST,
          code: HttpStatusCode.BadRequest,
          message: error.details[0].message.replace(/"/g, ""),
        });
      }
  
      const user = await ServiceProvider.findOne({
        email,
      });
  
      if (!user) {
        return res.status(HttpStatusCode.NotFound).json({
          status: HttpStatusConstant.NOT_FOUND,
          code: HttpStatusCode.NotFound,
          message: ResponseMessageConstant.SERVICE_PROVIDER_NOT_FOUND,
        });
      } else {
        
        const isValidPassword = await bcrypt.compare(password, user.password);
  
        if (isValidPassword) {
          const { email, username, userId } = user;
          const generatedAccessToken = await signToken({
            userId,
            username,
            email,
          });
          if (user.isActive == false) {
            user.isActive = true;
            user.save();
          }
          console.log(generatedAccessToken);
          res
            .cookie(CommonConstant.signatureCookieName, generatedAccessToken, {
              maxAge: 86400000,
              httpOnly: false,
              secure: true,
              sameSite: "none",
            })
            .status(HttpStatusCode.Ok)
            .json({
              status: HttpStatusConstant.OK,
              code: HttpStatusCode.Ok,
            });
        } else {
          res.status(HttpStatusCode.Unauthorized).json({
            status: HttpStatusConstant.UNAUTHORIZED,
            code: HttpStatusCode.Unauthorized,
            message: ResponseMessageConstant.INVALID_CREDENTIALS,
          });
        }
      }
    } catch (error) {
      console.log(
        ErrorLogConstant.authServiceProviderController.handleLoginErrorLog,
        error.message
      );
      res.status(HttpStatusCode.InternalServerError).json({
        status: HttpStatusConstant.ERROR,
        code: HttpStatusCode.InternalServerError,
      });
    }
  };