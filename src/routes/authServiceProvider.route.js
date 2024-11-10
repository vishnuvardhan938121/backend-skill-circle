const express = require("express");
const router = express.Router();

// Importing controllers
const authServiceProvider = require("../controllers/authServiceProvider.controller");

// Importing middlewares
const verifyUser = require("../middlewares/provider.mw");

// Manual Auth Routes
router.post("/register",authServiceProvider.handleRegister);
router.post("/login", authServiceProvider.handleLogin);
router.post("/logout", verifyUser, authServiceProvider.handleLogout);

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

// Session routes
router.post("/verify-session", authServiceProvider.handleVerifySession);

module.exports = router;
