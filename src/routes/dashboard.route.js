const express = require("express");
const services = require("../controllers/service.controller")
const router = express.Router();
const serviceCategory = require("../controllers/service-category.controller")
const multer = require("../middlewares/multer.mw")
router.get("/services",services.handleGetAllServices);

router.post("/createServiceCategory",serviceCategory.handleCreateServiceCategory)

router.post("/createService",multer.single("image"),services.handleCreateService);

module.exports = router;