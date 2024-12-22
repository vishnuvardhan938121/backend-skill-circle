const Joi = require("joi");
const bcrypt = require("bcryptjs");

const HttpStatusConstant = require("../constants/http-message.constant");
const HttpStatusCode = require("../constants/http-code.constant");
const ResponseMessageConstant = require("../constants/response-message.constant");
const CommonConstant = require("../constants/common.constant");
const ErrorLogConstant = require("../constants/error-log.constant");
const { v4: uuidv4 } = require("uuid");
const User = require("../models/user.model");
const { Service } = require("../models/service.model");
const ServiceProvider = require("../models/service-provider.model");

const generateUUID = require("../helpers/uuid.helper");

const imageController = require("./image.controller");

exports.handleCheckUsernameAvailability = async (req, res) => {
  try {
    const { username } = req.body;

    const userValidation = Joi.object({
      username: Joi.string().required(),
    });

    const { error } = userValidation.validate(req.body);

    if (error) {
      return res.status(HttpStatusCode.BadRequest).json({
        status: HttpStatusConstant.BAD_REQUEST,
        code: HttpStatusCode.BadRequest,
        message: error.details[0].message.replace(/"/g, ""),
      });
    }

    const checkIsUserExists = await User.exists({
      username,
    });

    if (checkIsUserExists) {
      res.status(HttpStatusCode.Conflict).json({
        status: HttpStatusConstant.CONFLICT,
        code: HttpStatusCode.Conflict,
        message: ResponseMessageConstant.USERNAME_ALREADY_EXISTS,
      });
    } else {
      res.status(HttpStatusCode.Ok).json({
        status: HttpStatusConstant.OK,
        code: HttpStatusCode.Ok,
        message: ResponseMessageConstant.USERNAME_AVAILABLE,
        isAvailable: true,
      });
    }
  } catch (error) {
    console.log(
      ErrorLogConstant.userController.handleCheckUsernameAvailabilityErrorLog,
      error.message
    );
    res.status(HttpStatusCode.InternalServerError).json({
      status: HttpStatusConstant.ERROR,
      code: HttpStatusCode.InternalServerError,
    });
  }
};

exports.handleUpdateUsername = async (req, res) => {
  try {
    const { username } = req.body;

    const userValidation = Joi.object({
      username: Joi.string().required(),
    });

    const { error } = userValidation.validate(req.body);
    if (error) {
      return res.status(HttpStatusCode.BadRequest).json({
        status: HttpStatusConstant.BAD_REQUEST,
        code: HttpStatusCode.BadRequest,
        message: error.details[0].message.replace(/"/g, ""),
      });
    }

    const checkIsUsernameAlreadyExists = await User.exists({
      username,
    });

    if (checkIsUsernameAlreadyExists) {
      return res.status(HttpStatusCode.Conflict).json({
        status: HttpStatusConstant.CONFLICT,
        code: HttpStatusCode.Conflict,
        message: ResponseMessageConstant.USERNAME_ALREADY_EXISTS,
      });
    }

    const { userId } = req.userSession;

    const checkIsUserExists = await User.findOne({
      userId,
    });

    if (!checkIsUserExists) {
      res.status(HttpStatusCode.NotFound).json({
        status: HttpStatusConstant.NOT_FOUND,
        code: HttpStatusCode.NotFound,
        message: ResponseMessageConstant.USER_NOT_FOUND,
      });
    } else {
      await User.findOneAndUpdate(
        {
          userId,
        },
        {
          $set: {
            ...req.body,
          },
        }
      );

      res.status(HttpStatusCode.Ok).json({
        status: HttpStatusConstant.OK,
        code: HttpStatusCode.Ok,
        message: ResponseMessageConstant.USER_UPDATED_SUCCESSFULLY,
      });
    }
  } catch (error) {
    console.log(
      ErrorLogConstant.userController.handleUpdateUsernameErrorLog,
      error.message
    );
    res.status(HttpStatusCode.InternalServerError).json({
      status: HttpStatusConstant.ERROR,
      code: HttpStatusCode.InternalServerError,
    });
  }
};

exports.handleOnBoarding = async (req, res) => {
  try {
    const onBoardingValidation = Joi.object({
      services: Joi.array()
        .items(
          Joi.object({
            categoryId: Joi.string().required(),
            serviceId: Joi.string().required(),
            pricingRange: Joi.number().required(),
            experienceLevel:Joi.string().required(),
            rating:Joi.number(),
          })
        )
        .required(),
      address: Joi.string().required(),
      
      state: Joi.string().default("Telangana"),
      country: Joi.string().default("India"),
      mobile:Joi.number().required(),
      pinCode: Joi.number().required(),
      latitude: Joi.number().optional(),
      longitude: Joi.number().optional(),
    });

    const { error } = onBoardingValidation.validate(req.body);

    if (error) {
      return res.status(HttpStatusCode.BadRequest).json({
        status: HttpStatusConstant.BAD_REQUEST,
        code: HttpStatusCode.BadRequest,
        message: error.details[0].message.replace(/"/g, ""),
        error
      });
    }

    const { userId } = req.providerSession;

    const serviceProvider = await ServiceProvider.findOne({ userId });
    if (!serviceProvider) {
      return res.status(HttpStatusCode.NotFound).json({
        status: HttpStatusConstant.NOT_FOUND,
        code: HttpStatusCode.NotFound,
        message: ResponseMessageConstant.USER_NOT_FOUND,
      });
    }

    const {
      services,
      address,
      mobile,
      state,
      country,
      pinCode,
      latitude,
      longitude,
    } = req.body;

    const serviceValidationResults = await Promise.all(
      services.map(async (service) => {
        const existingService = await Service.findOne({
          serviceId: service.serviceId, // Query by serviceId instead of _id
          categoryId: service.categoryId,
        });
        serviceProvider.serviceId = service.serviceId;
        serviceProvider.serviceCategoryId = service.categoryId;
        serviceProvider.minPrice=service.pricingRange;
        serviceProvider.maxRating=service.rating;
        serviceProvider.experienceLevel=service.experienceLevel;

        return !!existingService;
      })
    );
    

    const areAllServicesValid = serviceValidationResults.every(Boolean);

    if (!areAllServicesValid) {
      return res.status(HttpStatusCode.BadRequest).json({
        status: HttpStatusConstant.BAD_REQUEST,
        code: HttpStatusCode.BadRequest,
        message: ResponseMessageConstant.INVALID_SKILLS,
      });
    }

    
    serviceProvider.isOnboardingCompleted = true;
    serviceProvider.address = address;
    serviceProvider.state = state;
    serviceProvider.country = country;
    serviceProvider.pinCode = pinCode;
    serviceProvider.mobile= mobile;
    if (latitude) serviceProvider.latitude = latitude;
    if (longitude) serviceProvider.longitude = longitude;

    await serviceProvider.save();

    return res.status(HttpStatusCode.Ok).json({
      status: HttpStatusConstant.OK,
      code: HttpStatusCode.Ok,
      message: ResponseMessageConstant.USER_UPDATED_SUCCESSFULLY,
    });
  } catch (error) {
    console.error(
      ErrorLogConstant.userController.handleOnBoardingErrorLog,
      error
    );
    return res.status(HttpStatusCode.InternalServerError).json({
      status: HttpStatusConstant.ERROR,
      code: HttpStatusCode.InternalServerError,
      message: error.message || ResponseMessageConstant.INTERNAL_SERVER_ERROR,
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.userSession;

    const checkIsUserExists = await User.findOne({
      userId,
    });

    if (!checkIsUserExists) {
      return res.status(HttpStatusCode.NotFound).json({
        status: HttpStatusConstant.NOT_FOUND,
        code: HttpStatusCode.NotFound,
        message: ResponseMessageConstant.USER_NOT_FOUND,
      });
    } else {
      let fileName;
      if (checkIsUserExists.profilePhoto && req.file) {
        const parts = checkIsUserExists.profilePhoto.split("/");

        fileName = parts[parts.length - 1];

        await imageController.removeImageFromS3(fileName);
      }

      let imageUrl;

      if (req.file) {
        const imageName = generateUUID();
        imageUrl = await imageController.uploadImageToS3(imageName, req.file);
      }

      let userData;

      if (imageUrl == null) {
        userData = {
          ...req.body,
        };
      } else {
        userData = {
          ...req.body,
          profilePhoto: imageUrl,
        };
      }

      await User.findOneAndUpdate(
        {
          userId,
        },
        {
          $set: {
            ...userData,
          },
        },
        { new: true, runValidators: true }
      );

      return res.status(HttpStatusCode.Ok).json({
        status: HttpStatusConstant.OK,
        code: HttpStatusCode.Ok,
        message: ResponseMessageConstant.USER_UPDATED_SUCCESSFULLY,
      });
    }
  } catch (error) {
    console.log(
      ErrorLogConstant.userController.updateUserProfileInfoErrorLog,
      error.message
    );
    return res.status(HttpStatusCode.InternalServerError).json({
      status: HttpStatusConstant.ERROR,
      code: HttpStatusCode.InternalServerError,
    });
  }
};


exports.updateProvider = async (req, res) => {
  try {
    const { userId } = req.providerSession;

    const checkIsUserExists = await User.findOne({
      userId,
    });

    if (!checkIsUserExists) {
      return res.status(HttpStatusCode.NotFound).json({
        status: HttpStatusConstant.NOT_FOUND,
        code: HttpStatusCode.NotFound,
        message: ResponseMessageConstant.USER_NOT_FOUND,
      });
    } else {
      let fileName;
      if (checkIsUserExists.profilePhoto && req.file) {
        const parts = checkIsUserExists.profilePhoto.split("/");

        fileName = parts[parts.length - 1];

        await imageController.removeImageFromS3(fileName);
      }

      let imageUrl;

      if (req.file) {
        const imageName = generateUUID();
        imageUrl = await imageController.uploadImageToS3(imageName, req.file);
      }

      let userData;

      if (imageUrl == null) {
        userData = {
          ...req.body,
        };
      } else {
        userData = {
          ...req.body,
          profilePhoto: imageUrl,
        };
      }

      await User.findOneAndUpdate(
        {
          userId,
        },
        {
          $set: {
            ...userData,
          },
        },
        { new: true, runValidators: true }
      );

      return res.status(HttpStatusCode.Ok).json({
        status: HttpStatusConstant.OK,
        code: HttpStatusCode.Ok,
        message: ResponseMessageConstant.USER_UPDATED_SUCCESSFULLY,
      });
    }
  } catch (error) {
    console.log(
      ErrorLogConstant.userController.updateUserProfileInfoErrorLog,
      error.message
    );
    return res.status(HttpStatusCode.InternalServerError).json({
      status: HttpStatusConstant.ERROR,
      code: HttpStatusCode.InternalServerError,
    });
  }
};

exports.checkServiceProviderUsernameAvailability = async (req, res) => {
  try {
    const { username } = req.body;

    const userValidation = Joi.object({
      username: Joi.string().required(),
    });

    const { error } = userValidation.validate(req.body);

    if (error) {
      return res.status(HttpStatusCode.BadRequest).json({
        status: HttpStatusConstant.BAD_REQUEST,
        code: HttpStatusCode.BadRequest,
        message: error.details[0].message.replace(/"/g, ""),
      });
    }

    const checkIsUserExists = await ServiceProvider.exists({
      username,
    });

    if (checkIsUserExists) {
      res.status(HttpStatusCode.Conflict).json({
        status: HttpStatusConstant.CONFLICT,
        code: HttpStatusCode.Conflict,
        message: ResponseMessageConstant.USERNAME_ALREADY_EXISTS,
      });
    } else {
      res.status(HttpStatusCode.Ok).json({
        status: HttpStatusConstant.OK,
        code: HttpStatusCode.Ok,
        message: ResponseMessageConstant.USERNAME_AVAILABLE,
        isAvailable: true,
      });
    }
  } catch (error) {
    console.log(
      ErrorLogConstant.userController.handleCheckUsernameAvailabilityErrorLog,
      error.message
    );
    res.status(HttpStatusCode.InternalServerError).json({
      status: HttpStatusConstant.ERROR,
      code: HttpStatusCode.InternalServerError,
    });
  }
};


// Predefined arrays of service category IDs and service IDs
const serviceCategoryIds = [
  "1ad8c1bf9738476f97f997d6600ecf16",
  "bf75a542b47e41268d65f2c9d16fe26a",
  "9a51e536c2e74074a8fddde7aff011b5",
  "7e8160ba9ae44b9d89268429e8ea9f25",
  "886e2ead5d5c4df4bda4d2a28358909d",
  "8848a31cef934843907e70944b5c9b5e",
  "488972896a0a4be98ad3ebf295be80db",
  "4d032da96d134b83bf64c3d7cebc002b",
  "8596c7475e1a47c998e1dd391d260f18",
  "1d3e2b93d34a42369da089fc66218ea3",
];

const serviceIds = [
  "1e1e7e67-cd1c-4d3a-bfb5-10a3fa70421c", 
  "e0077f24-7679-4a39-b903-8410c98ac045", 
  "82a09549-069b-4b60-bafa-b54b4c281c19",
  "f8195625-d4bb-461f-a8a6-2485f71e3167",
  "4ad8928a-0a17-4b67-b204-3718915311e0",
  "f1091e77-e6f7-4cd2-8593-335e462c8fb9",
  "068317f7-54ac-41ee-9d90-858d67eee6ce",
  "eb39d552-07a1-418c-b777-61c673b0ad06",
"29487018-2716-475a-9664-b6e81422b13c",
"d07b308a-ba29-457d-bb8c-2b3680332e76",
"67cf5a51-cef7-43a8-9df5-7f5124a8ca1e",
"49a85479-e919-45cd-97b6-326474947940",
"49b6596b-c170-48ab-bb7b-862c5376eadc",
"7a87fe95-871a-4dc5-8259-882c654dcd00",
"345771cb-9a52-4f75-a409-dcc1757f7659",
"fb1e1b8c-1c24-4286-bbbf-9c6ab50242a1",
"a983ac1e-fc78-4c5d-b09a-6c34baed7175",
"b17d4d05-3f46-45c0-83c9-17cc2bb0fcbe",
"173d2320-dd0a-4554-ae73-57550f0f463b",
"3bb9824b-5268-46e9-aac4-4f36539ff770",
"ec0b2dcb-1638-40da-b7c9-3162d1b79d07",
"6dc4953c-1115-4e99-ad55-7b55be04c424",
"2e598bf2-588a-4285-9534-b07bd391bb8f",
"0a4dd9d9-9a4a-4eee-a9fd-3c6ae01074d3",
"604438e0-29b3-46ec-b0fe-783b416231a1",
];

let username;
// Function to generate a random email
const generateRandomEmail = () => {
  const randomString = Math.random().toString(36).substring(2, 15); // Generates a random string
    username=randomString
  return `${randomString}@gmail.com`; // Use a Gmail domain for simplicity
};

// Generate a hashed password
const generateHashedPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Sample function to generate the data and store it in DB
const generateSampleData = async () => {
  const hashedPassword = await generateHashedPassword("skillcircle");

  // Randomly pick a serviceCategoryId and serviceId from the predefined arrays
  const serviceCategoryId = serviceCategoryIds[Math.floor(Math.random() * serviceCategoryIds.length)];
  const serviceId = serviceIds[Math.floor(Math.random() * serviceIds.length)];

  // Generate a random email
  const randomEmail = generateRandomEmail();

  const sampleData = new ServiceProvider({
    username: username,
    email: randomEmail, // Use the random email
    password: hashedPassword,
    state: "Telangana",
    country: "India",
    profilePhoto:
      "https://lh3.googleusercontent.com/a/ACg8ocI71TOG_LqlJ_u4knP3eFMD478mXKlDeRg70Dlyjf20TEDKpg=s96-c",
    ratingIds: [],
    bookingIds: [],
    isEmailVerified: true,
    isOnboardingCompleted: false,
    userId: uuidv4(),
    rating:3.5,
    minPrice:600,
    experienceLevel:"beginner",
    createdAt: new Date(),
    updatedAt: new Date(),
    address: "18-1-337/34/1\nArundathi Colony",
    mobile: 9700419039,
    pinCode: 500053,
    serviceCategoryId: serviceCategoryId,  // Use the randomly selected category ID
    serviceId: serviceId,  // Use the randomly selected service ID
  });

  try {
    // Save the data to the database
    const savedData = await sampleData.save();
    console.log("Data saved successfully:", savedData);
  } catch (error) {
    console.error("Error saving data:", error);
  }
};

// Function to call `generateSampleData` 20 times concurrently
const generateMultipleSampleData = async (numCalls = 20) => {
  const promises = [];

  for (let i = 0; i < numCalls; i++) {
    promises.push(generateSampleData());
  }

  try {
    await Promise.all(promises); // Wait for all promises to resolve
    console.log(`${numCalls} sample data records saved successfully!`);
  } catch (error) {
    console.error("Error saving multiple records:", error);
  }
};



exports.generateData= async (req,res)=>{
  try {
    // Generate and save 20 sample data records
generateMultipleSampleData();

res.send(200)
  } catch (error) {
    res.send(500)
  }
}





exports.providerList = async (req, res) => {
  const { serviceName } = req.query; // Assuming you're passing the service name as a query parameter

  try {
    // 1. Find the service by name
    const service = await Service.findOne({ serviceName: serviceName });

    if (!service) {
      return res.status(HttpStatusCode.NotFound).json({
        status: "ERROR",
        message: "Service not found",
      });
    }

    // 2. Find all service providers who offer this service
    const providers = await ServiceProvider.find({ serviceId: service.serviceId });

    if (providers.length === 0) {
      return res.status(HttpStatusCode.NotFound).json({
        status: "ERROR",
        message: "No providers found for this service",
      });
    }

    // 3. Return the list of providers
    return res.status(HttpStatusCode.Ok).json({
      status: "OK",
      data: providers,
    });

  } catch (error) {
    console.log("Error in user.controller.js", error);
    return res.status(HttpStatusCode.InternalServerError).json({
      status: "ERROR",
      message: "Internal server error",
    });
  }
};
