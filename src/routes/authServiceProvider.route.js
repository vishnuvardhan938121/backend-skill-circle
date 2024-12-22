const express = require("express");
const router = express.Router();
const passport = require("passport");

// Importing controllers
const authServiceProvider = require("../controllers/authServiceProvider.controller");
const userController= require("../controllers/user.controller")
// Importing middlewares
const verifyUser = require("../middlewares/provider.mw");

// Manual Auth Routes
router.post("/register",authServiceProvider.handleRegister);
router.post("/login", authServiceProvider.handleLogin);
router.post("/logout", verifyUser, authServiceProvider.handleLogout);

router.get(
"/google",
  passport.authenticate("google-provider", { scope: ["profile", "email"] })
);

router.get(
    "/google/callback",
    passport.authenticate("google-provider", {
      failureRedirect: process.env.CLIENT_URL,
    }),
    authServiceProvider.handleGoogleLogin
  );

// Verification routes
router.post(
    "/send/verification-email",
    verifyUser,
    authServiceProvider.handleSendVerificationEmail,
);
router.post(
    "/verify-email/:verification_token",
    authServiceProvider.handleVerifyEmail,
);

// reset password routes
router.post("/forgot-password", authServiceProvider.handleSendResetPassMail);
router.post(
    "/reset-password/:password_reset_token",
    authServiceProvider.handleResetPass,
);

router.post("/checkUserName",userController.handleCheckUsernameAvailability);

// Session routes
router.post("/verify-session", authServiceProvider.handleVerifySession);

module.exports = router;
