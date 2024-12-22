const express = require("express");
const router = express.Router();
const passport = require("passport");

// Importing controllers
const authController = require("../controllers/auth.controller");
const userController = require("../controllers/user.controller");
// Importing middlewares
const verifyUser = require("../middlewares/user.mw");

// Manual Auth Routes
router.post("/register", authController.handleRegister);
router.post("/login", authController.handleLogin);
router.post("/logout", verifyUser, authController.handleLogout);
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: process.env.CLIENT_URL,
  }),
  authController.handleGoogleLogin
);

// Verification routes
router.post(
  "/send/verification-email",
  verifyUser,
  authController.handleSendVerificationEmail
);
router.post(
  "/verify-email/:verification_token",
  authController.handleVerifyEmail
);

// reset password routes
router.post("/forgot-password", authController.handleSendResetPassMail);
router.post(
  "/reset-password/:password_reset_token",
  authController.handleResetPass
);

router.post("/checkUserName", userController.handleCheckUsernameAvailability);

// Session routes
router.post("/verify-session", authController.handleVerifySession);



module.exports = router;
