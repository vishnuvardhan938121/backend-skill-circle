const HttpStatusConstant = require("../constants/http-message.constant");
const HttpStatusCode = require("../constants/http-code.constant");
const ResponseMessageConstant = require("../constants/response-message.constant");

const User = require("../models/user.model");

const { verifyToken } = require("../helpers/jwt.helper");
const {getSkillCircleSignature } =require("../helpers/cookie.helper");

const verifyUser = async (req, res, next) => {
  try {
    if (req.isAuthenticated()) {
      const { _json } = req.user;

      const email = _json.email;

      const customer = await User.findOne({
        email,
      }).select(
        "-password -_id -isManualAuth -createdAt -updatedAt -googleId -__v"
      );

      if (!customer) {
        return res.status(HttpStatusCode.Unauthorized).json({
          status: HttpStatusConstant.UNAUTHORIZED,
          code: HttpStatusCode.Unauthorized,
        });
      }

      req.userSession = customer;
      next();
    } else {
      if (!req.headers.cookie) {
        return res.status(HttpStatusCode.Unauthorized).json({
          status: HttpStatusConstant.UNAUTHORIZED,
          code: HttpStatusCode.Unauthorized,
        });
      }

      const accessToken = getSkillCircleSignature(req.headers.cookie);

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

        const customer = await User.findOne({
          userId: decodedToken.userId,
        }).select(
          "-password -_id -isManualAuth -createdAt -updatedAt -googleId -__v"
        );

        if (!customer) {
          return res.status(HttpStatusCode.Unauthorized).json({
            status: HttpStatusConstant.UNAUTHORIZED,
            code: HttpStatusCode.Unauthorized,
          });
        }

        req.userSession = decodedToken;
        next();
      }
    }
  } catch (error) {
    res.status(HttpStatusCode.Unauthorized).json({
      status: HttpStatusConstant.UNAUTHORIZED,
      code: HttpStatusCode.Unauthorized,
      message: ResponseMessageConstant.INVALID_TOKEN,
    });
  }
};

module.exports = verifyUser;
