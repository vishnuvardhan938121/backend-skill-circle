const CommonConstant = require("../constants/common.constant");

const getSkillCircleSignature = (cookies) => {
    const skillCircleSignature = cookies
        .split(";")
        .find((cookie) =>
            cookie.trim().startsWith(CommonConstant.signatureCookieName),
        );
    return skillCircleSignature ? skillCircleSignature.split("=")[1] : null;
};

module.exports = getSkillCircleSignature;
