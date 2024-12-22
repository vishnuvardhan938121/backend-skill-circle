const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

passport.use(
  "google",
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET, 
        callbackURL: `${process.env.SERVER_URL}/api/auth/google/callback`,
      },
      function (accessToken, refreshToken, profile, done) {
        profile.accessToken = accessToken; 
        profile.refreshToken = refreshToken;
        done(null, profile);
      }
    )
  );

  passport.use(
    "google-provider",
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET, 
        callbackURL: `${process.env.SERVER_URL}/api/auth/provider/google/callback`,
      },
      function (accessToken, refreshToken, profile, done) {
        profile.accessToken = accessToken; 
        profile.refreshToken = refreshToken;
        done(null, profile);
      }
    )
  );
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });

  module.exports = passport;
