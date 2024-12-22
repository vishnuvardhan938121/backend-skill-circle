const express = require("express");
const cors = require("cors");
const passport = require("./configs/passport");
const app = express();
const session = require("express-session");

app.use(
    cors({
        origin: ["http://localhost:3000",process.env.CLIENT_URL],
        methods: ["GET", "PUT", "POST", "DELETE", "OPTIONS"],
        credentials: true,
    }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
      secret: process.env.JWT_KEY,
      resave: true,
      saveUninitialized: false,
    })
  );

app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
    res.send("Server is Live!!");
});

const routes = require("./routes");
app.use("/api", routes);

module.exports = app;
