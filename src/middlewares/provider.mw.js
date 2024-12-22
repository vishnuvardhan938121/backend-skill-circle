const HttpStatusConstant = require("../constants/http-message.constant");
const HttpStatusCode = require("../constants/http-code.constant");
const ResponseMessageConstant = require("../constants/response-message.constant");

const Service = require("../models/service-provider.model");

const { verifyToken } = require("../helpers/jwt.helper");
const {getProviderSignature} = require("../helpers/cookie.helper");

const verifyUser = async (req, res, next) => {
  try {
    if (req.isAuthenticated()) {
      const { _json } = req.user;

      const email = _json.email;

      const user = await Service.findOne({
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

      req.providerSession = user;
      next();
    } else {
      if (!req.headers.cookie) {
        return res.status(HttpStatusCode.Unauthorized).json({
          status: HttpStatusConstant.UNAUTHORIZED,
          code: HttpStatusCode.Unauthorized,
        });
      }

      const accessToken = getProviderSignature(req.headers.cookie);

      console.log(accessToken)
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

        const user = await Service.findOne({
          userId: decodedToken.userId,
        }).select(
          "-password -_id -isManualAuth -createdAt -updatedAt -googleId -__v"
        );

        if (!user) {
          return res.status(HttpStatusCode.Unauthorized).json({
            status: HttpStatusConstant.UNAUTHORIZED,
            code: HttpStatusCode.Unauthorized,
          });
        }

        req.providerSession = decodedToken;
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
