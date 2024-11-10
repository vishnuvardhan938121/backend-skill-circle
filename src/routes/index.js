const express = require("express");
const router = express.Router();
const authRoute = require("./auth.route");
const authProvider = require("./authServiceProvider.route");
const Dashboard= require("./dashboard.route")

router.use("/auth", authRoute);
router.use("/auth/provider",authProvider);
router.use('/home',Dashboard);

module.exports = router;
