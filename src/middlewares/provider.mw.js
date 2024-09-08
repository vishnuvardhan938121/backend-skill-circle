const HttpStatusConstant = require("../constants/http-message.constant");
const HttpStatusCode = require("../constants/http-code.constant");
const ResponseMessageConstant = require("../constants/response-message.constant");

const Service = require("../models/service-provider.model");

const { verifyToken } = require("../helpers/jwt.helper");
const getSkillCircleSignature = require("../helpers/cookie.helper");

const verifyUser = async (req, res, next) => {
    try {
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

            const Service = await Service.findOne({
                userId: decodedToken.userId,
            });

            if (!Service) {
                return res.status(HttpStatusCode.Unauthorized).json({
                    status: HttpStatusConstant.UNAUTHORIZED,
                    code: HttpStatusCode.Unauthorized,
                });
            }

            req.providerSession = decodedToken;
            next();
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
