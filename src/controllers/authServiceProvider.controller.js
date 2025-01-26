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
const getProviderSignature = require("../helpers/cookie.helper");

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
    const ExistingServiceProvider = await ServiceProvider.findOne({
      email,
    });

    if (ExistingServiceProvider) {
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
          .cookie(
            CommonConstant.signatureProviderCookieName,
            generatedAccessToken,
            {
              maxAge: 86400000,
              httpOnly: false,
              secure: false,
              sameSite: "lax",
            }
          )
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

exports.handleGoogleLogin = async (req, res) => {
  try {
    const { _json } = req.user;

    const email = _json.email;

    const user = await ServiceProvider.findOne({
      email,
    });

    if (!user) {
      const encryptedPassword = await bcrypt.hash(email, 10);

      await ServiceProvider.create({
        username: _json.given_name,
        email,
        password: encryptedPassword,
        profilePhoto: _json.picture,
        name: _json.given_name,
        isEmailVerified: true,
      });
    }
  
      // Redirect to the client-side success page
      res.redirect(`${process.env.CLIENT_URL}/provider-success?provider=${email}`);
  } catch (error) {
    console.log(
      ErrorLogConstant.authController.handleLoginErrorLog,
      error.message
    );
    res.status(HttpStatusCode.InternalServerError).json({
      status: HttpStatusConstant.ERROR,
      code: HttpStatusCode.InternalServerError,
    });
  }
};

exports.handleLogout = async (req, res) => {
  try {
    const accessToken = getSkillCircleSignature(req.headers.cookie);

    await jwtToken.findOneAndDelete({
      jwtTokenId: accessToken,
    });

    res
      .clearCookie(CommonConstant.signatureCookieName, {
        secure: true,
        sameSite: "none",
      })
      .status(HttpStatusCode.Ok)
      .json({
        status: HttpStatusConstant.OK,
        code: HttpStatusCode.Ok,
      });
  } catch (error) {
    console.log(
      ErrorLogConstant.authServiceProviderController.handleLogoutErrorLog,
      error.message
    );
    res.status(HttpStatusCode.InternalServerError).json({
      status: HttpStatusConstant.ERROR,
      code: HttpStatusCode.InternalServerError,
    });
  }
};

exports.handleVerifySession = async (req, res) => {
  try {
    if (req.isAuthenticated()) {
      const { _json } = req.user;

      const email = _json.email;

      const user = await ServiceProvider.findOne({
        email,
      }).select(
        "-password -_id -isManualAuth -createdAt -updatedAt -googleId -__v"
      );

      if (!user) {
        return res.status(HttpStatusCode.Unauthorized).json({
          status: HttpStatusConstant.UNAUTHORIZED,
          code: HttpStatusCode.Unauthorized,
        });
      }
      user.profilePhoto=_json.picture;
    
      res.status(HttpStatusCode.Ok).json({
        status: HttpStatusConstant.OK,
        code: HttpStatusCode.Ok,
        data: {...user.toObject(),userType:"Provider"},
      });
    } else {
      if (!req.headers.cookie) {
        return res.status(HttpStatusCode.Unauthorized).json({
          status: HttpStatusConstant.UNAUTHORIZED,
          code: HttpStatusCode.Unauthorized,
        });
      }

      const accessToken = getProviderSignature(req.headers.cookie);

      if (!accessToken) {
        return res.status(HttpStatusCode.Unauthorized).json({
          status: HttpStatusConstant.UNAUTHORIZED,
          code: HttpStatusCode.Unauthorized,
        });
      } else {
        const decodedToken = await verifyToken(accessToken);
        if (!decodedToken) {
          return res.status(HttpStatusCode.Unauthorized).json({
            status: HttpStatusConstant.UNAUTHORIZED,
            code: HttpStatusCode.Unauthorized,
          });
        }

        const user = await ServiceProvider.findOne({
          userId: decodedToken.userId,
        }).select("-password -_id -isManualAuth -createdAt -updatedAt -__v");

        if (!user) {
          return res.status(HttpStatusCode.Unauthorized).json({
            status: HttpStatusConstant.UNAUTHORIZED,
            code: HttpStatusCode.Unauthorized,
          });
        }

        res.status(HttpStatusCode.Ok).json({
          status: HttpStatusConstant.OK,
          code: HttpStatusCode.Ok,
          data: user,
        });
      }
    }
  } catch (error) {
    console.log(
      ErrorLogConstant.authServiceProviderController
        .handleVerifySessionErrorLog,
      error.message
    );
    res.status(HttpStatusCode.InternalServerError).json({
      status: HttpStatusConstant.ERROR,
      code: HttpStatusCode.InternalServerError,
    });
  }
};

exports.handleSendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const userValidation = Joi.object({
      email: Joi.string().email().required(),
    });

    const { error } = userValidation.validate(req.body);

    if (error) {
      return res.status(HttpStatusCode.BadRequest).json({
        status: HttpStatusConstant.BAD_REQUEST,
        code: HttpStatusCode.BadRequest,
        message: error.details[0].message.replace(/"/g, ""),
      });
    }

    const { userId } = req.providerSession;

    const user = await ServiceProvider.findOne({ email });

    if (!user) {
      return res.status(HttpStatusCode.NotFound).json({
        status: HttpStatusConstant.NOT_FOUND,
        code: HttpStatusCode.NotFound,
        message: ResponseMessageConstant.USER_NOT_FOUND,
      });
    }

    if (user.isEmailVerified) {
      return res.status(HttpStatusCode.BadRequest).json({
        status: HttpStatusConstant.BAD_REQUEST,
        code: HttpStatusCode.BadRequest,
        message: ResponseMessageConstant.EMAIL_ALREADY_VERIFIED,
      });
    }

    if (user.userId !== userId) {
      return res.status(HttpStatusCode.Forbidden).json({
        status: HttpStatusConstant.FORBIDDEN,
        code: HttpStatusCode.Forbidden,
        message: ResponseMessageConstant.INCORRECT_AUTHENTICATION,
      });
    }

    const checkIsVerificationTokenExists = await verificationToken.findOne({
      userId,
    });

    let emailAccessTokenId;

    if (checkIsVerificationTokenExists) {
      emailAccessTokenId = checkIsVerificationTokenExists.verificationTokenId;
    } else {
      const verificationTokenResponse = await verificationToken.create({
        verificationTokenId: generateUUID(),
        userId,
      });
      emailAccessTokenId = verificationTokenResponse.verificationTokenId;
    }

    const isEmailSend = await handleSendEmail({
      toAddresses: [email],
      source: CommonConstant.email.source.tech_team,
      subject: CommonConstant.email.verificationEmail.subject,
      htmlData: `<p>Hello User <br/>Welcome to Skill-Circle<br/> Your verification link <a href="${process.env.CLIENT_URL}/verify-email/${emailAccessTokenId}">Verify Email</a></p>`,
    });

    if (isEmailSend) {
      return res.status(HttpStatusCode.Ok).json({
        status: HttpStatusConstant.OK,
        code: HttpStatusCode.Ok,
        message: ResponseMessageConstant.VERIFICATION_EMAIL_SENT_SUCCESSFULLY,
      });
    } else {
      return res.status(HttpStatusCode.InternalServerError).json({
        status: HttpStatusConstant.ERROR,
        code: HttpStatusCode.InternalServerError,
        message: ResponseMessageConstant.VERIFICATION_EMAIL_SENT_FAILED,
      });
    }
  } catch (error) {
    console.log(
      ErrorLogConstant.userController.handleSendVerificationEmailErrorLog,
      error.message
    );
    return res.status(HttpStatusCode.InternalServerError).json({
      status: HttpStatusConstant.ERROR,
      code: HttpStatusCode.InternalServerError,
    });
  }
};

exports.handleVerifyEmail = async (req, res) => {
  try {
    const { verification_token } = req.params;

    const userValidation = Joi.object({
      verification_token: Joi.string().required(),
    });

    const { error } = userValidation.validate(req.params);
    if (error) {
      return res.status(HttpStatusCode.BadRequest).json({
        status: HttpStatusConstant.BAD_REQUEST,
        code: HttpStatusCode.BadRequest,
        message: error.details[0].message.replace(/"/g, ""),
      });
    }

    const checkIsVerificationTokenExists = await verificationToken.findOne({
      verificationTokenId: verification_token,
    });

    if (!checkIsVerificationTokenExists) {
      return res.status(HttpStatusCode.NotFound).json({
        status: HttpStatusConstant.NOT_FOUND,
        code: HttpStatusCode.NotFound,
        message: ResponseMessageConstant.VERIFICATION_TOKEN_NOT_FOUND,
      });
    } else {
      const { userId } = checkIsVerificationTokenExists;

      const checkIsUserExists = await ServiceProvider.findOne({
        userId,
      });

      if (!checkIsUserExists) {
        return res.status(HttpStatusCode.NotFound).json({
          status: HttpStatusConstant.NOT_FOUND,
          code: HttpStatusCode.NotFound,
          message: ResponseMessageConstant.USER_NOT_FOUND,
        });
      } else {
        if (checkIsUserExists.isEmailVerified) {
          return res.status(HttpStatusCode.BadRequest).json({
            status: HttpStatusConstant.BAD_REQUEST,
            code: HttpStatusCode.BadRequest,
            message: ResponseMessageConstant.EMAIL_ALREADY_VERIFIED,
          });
        } else {
          await User.findOneAndUpdate(
            {
              userId,
            },
            {
              $set: {
                isEmailVerified: true,
              },
            }
          );
          await verificationToken.findOneAndDelete({
            verificationTokenId: verificationToken,
          });
          res.status(HttpStatusCode.Ok).json({
            status: HttpStatusConstant.OK,
            code: HttpStatusCode.Ok,
            message: ResponseMessageConstant.EMAIL_VERIFIED_SUCCESSFULLY,
          });
        }
      }
    }
  } catch (error) {
    console.log(
      ErrorLogConstant.userController.handleSendVerificationEmailErrorLog,
      error.message
    );
    res.status(HttpStatusCode.InternalServerError).json({
      status: HttpStatusConstant.ERROR,
      code: HttpStatusCode.InternalServerError,
    });
  }
};

exports.handleSendResetPassMail = async (req, res) => {
  try {
    const { email } = req.body;

    const userValidation = Joi.object({
      email: Joi.string().email().required(),
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
        message: ResponseMessageConstant.USER_NOT_FOUND,
      });
    }

    const userId = user.userId;

    const checkIsPasswordResetTokenExists = await PasswordResetToken.findOne({
      userId,
    });

    let passwordResetAccessTokenId;

    if (checkIsPasswordResetTokenExists) {
      passwordResetAccessTokenId =
        checkIsPasswordResetTokenExists.passwordResetTokenId;
    } else {
      const passwordResetTokenResponse = await PasswordResetToken.create({
        passwordResetTokenId: generateUUID(),
        userId,
      });
      passwordResetAccessTokenId =
        passwordResetTokenResponse.passwordResetTokenId;
    }

    const link = `${process.env.CLIENT_URL}/reset-password/${passwordResetAccessTokenId}`;

    const isEmailSend = await handleSendEmail({
      toAddresses: [email],
      source: CommonConstant.email.source.tech_team,
      subject: CommonConstant.email.resetPasswordEmail.subject,
      htmlData: emailTemplates.forgotPassword(link),
    });

    if (isEmailSend) {
      return res.status(HttpStatusCode.Ok).json({
        status: HttpStatusConstant.OK,
        code: HttpStatusCode.Ok,
        message: ResponseMessageConstant.PASSWORD_RESET_EMAIL_SENT_SUCCESSFULLY,
      });
    } else {
      return res.status(HttpStatusCode.InternalServerError).json({
        status: HttpStatusConstant.ERROR,
        code: HttpStatusCode.InternalServerError,
        message: ResponseMessageConstant.PASSWORD_RESET_EMAIL_SENT_FAILED,
      });
    }
  } catch (error) {
    console.log(
      ErrorLogConstant.userController.handleResetPassEmailErrorLog,
      error.message
    );
    return res.status(HttpStatusCode.InternalServerError).json({
      status: HttpStatusConstant.ERROR,
      code: HttpStatusCode.InternalServerError,
    });
  }
};

exports.handleResetPass = async (req, res) => {
  try {
    const { password_reset_token } = req.params;

    const userValidation = Joi.object({
      password_reset_token: Joi.string().required(),
    });

    const { error } = userValidation.validate(req.params);

    if (error) {
      return res.status(HttpStatusCode.BadRequest).json({
        status: HttpStatusConstant.BAD_REQUEST,
        code: HttpStatusCode.BadRequest,
        message: error.details[0].message.replace(/"/g, ""),
      });
    }

    const checkIsPasswordResetTokenExists = await PasswordResetToken.findOne({
      passwordResetTokenId: password_reset_token,
    });

    if (!checkIsPasswordResetTokenExists) {
      return res.status(HttpStatusCode.NotFound).json({
        status: HttpStatusConstant.NOT_FOUND,
        code: HttpStatusCode.NotFound,
        message: ResponseMessageConstant.PASSWORD_RESET_TOKEN_NOT_FOUND,
      });
    } else {
      const { userId } = checkIsPasswordResetTokenExists;

      const user = await ServiceProvider.findOne({
        userId,
      });

      if (!user) {
        return res.status(HttpStatusCode.NotFound).json({
          status: HttpStatusConstant.NOT_FOUND,
          code: HttpStatusCode.NotFound,
          message: ResponseMessageConstant.SERVICE_PROVIDER_NOT_FOUND,
        });
      } else {
        const { password } = req.body;

        const encryptedPassword = await bcrypt.hash(password, 10);
        user.password = encryptedPassword;

        await user.save();

        await PasswordResetToken.findOneAndDelete({
          passwordResetTokenId: password_reset_token,
        });

        res.status(HttpStatusCode.Ok).json({
          status: HttpStatusConstant.OK,
          code: HttpStatusCode.Ok,
          message: ResponseMessageConstant.PASSWORD_CHANGED_SUCCESSFULLY,
        });
      }
    }
  } catch (error) {
    console.log(
      ErrorLogConstant.userController.handleResetPassEmailErrorLog,
      error.message
    );
    return res.status(HttpStatusCode.InternalServerError).json({
      status: HttpStatusConstant.ERROR,
      code: HttpStatusCode.InternalServerError,
    });
  }
};
