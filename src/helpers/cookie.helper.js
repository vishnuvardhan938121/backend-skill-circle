const CommonConstant = require("../constants/common.constant");

exports.getSkillCircleSignature = (cookies) => {
    const skillCircleSignature = cookies
        .split(";")
        .find((cookie) =>
            cookie.trim().startsWith(CommonConstant.signatureCookieName),
        );
    return skillCircleSignature ? skillCircleSignature.split("=")[1] : null;
};

exports.getProviderSignature = (cookies) => {
   
    const skillCircleSignature = cookies
        .split(";")
        .find((cookie) =>
            cookie.trim().startsWith(CommonConstant.signatureProviderCookieName),
        );
       
    return skillCircleSignature ? skillCircleSignature.split("=")[1] : null;
};

