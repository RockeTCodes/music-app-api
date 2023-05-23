const express = require("express");
const bodyParser = require("body-parser");
const passport = require("passport");
const session = require("express-session");
const LocalStrategy = require("passport-local").Strategy;
const { User } = require("../models");
const bcrypt = require("bcrypt");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use("/uploads", express.static("uploads"));

app.use(
  session({
    secret: "rocketcodesisawesome",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
    User.findOne({ email: email }, (err, user) => {
      if (err) return done(err);
      if (!user) return done(null, false, { message: "Incorrect email" });

      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) throw err;
        if (isMatch) {
          return done(null, user);
        } else {
          return done(null, false, { message: "Incorrect password" });
        }
      });
    });
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

const register = async (req, res) => {
  const { email, password, name } = req.body;

  User.findOne({ email: email }, (err, user) => {
    if (err) {
      return res.status(500).json({ message: "Server Error." });
    } else if (user) {
      return res.status(400).json({ message: "User already exist." });
    }
    const saltRounds = 10;
    bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
      if (err) {
        return res.status(500).json({ message: "Server Error" });
      }
      const newUser = new User({
        email: email,
        password: hashedPassword,
        name: name,
      });

      newUser.save((err) => {
        if (err) {
          return res.status(500).json({ message: "Server Error" });
        }
        return res
          .status(201)
          .json({ message: "You have been registered Successfully" });
      });
    });
  });
};

const login = async (req, res) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return res.status(500).json({ message: "Internal Server Error" });
    }
    if (!user) {
      return res.status(401).json({ message: info.message });
    }
    req.logIn(user, (err) => {
      if (err) {
        return res.status(500).json({ message: "Internal Server Error" });
      }
      return res.json({ message: "Login successful", user: req.user });
    });
  })(req, res);
};

const logout = async (req, res) => {
  req.logout(function (err) {
    if (err) {
      console.log(err);
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Internal Server Error" });
      }
      res.json({ message: "Logout successful" });
    });
  });
};

const checkLoginStatus = async (req, res) => {
  if (req.isAuthenticated()) {
    // User is logged in
    res.json({
      isLoggedIn: true,
      user: req.user,
    });
  } else {
    // User is not logged in
    res.json({
      isLoggedIn: false,
      user: null,
    });
  }
};

module.exports = { app, register, login, logout, checkLoginStatus };
