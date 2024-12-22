const express = require("express");
const services = require("../controllers/service.controller")
const router = express.Router();
const serviceCategory = require("../controllers/service-category.controller")
const multer = require("../middlewares/multer.mw")
const userController = require("../controllers/user.controller");
const verifyUser= require("../middlewares/user.mw");
const verifyProvider = require("../middlewares/provider.mw")
const serviceController = require("../controllers/service.controller")
router.get("/services",services.handleGetAllServices);

router.post("/createServiceCategory",serviceCategory.handleCreateServiceCategory)

router.post("/createService",multer.single("image"),services.handleCreateService);

router.get("/allServices",serviceController.getAllServices);

router.post("/onBoarding",verifyProvider,userController.handleOnBoarding);

router.put("/userprofile",multer.single("profilePhoto"),verifyUser,userController.updateUser);

router.get("/generateData",userController.generateData);

router.get("/providerList",verifyUser,userController.providerList);

module.exports = router;