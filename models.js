const mongoose = require("mongoose");

const songSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  file: {
    type: String,
    required: true,
  },
  singer: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  cover: {
    type: String,
    required: true,
  },
});

const playListSchema = new mongoose.Schema({
  user: {
    type: String,
  },
  name: {
    type: String,
    required: true,
  },
  songs: {
    type: [songSchema],
  },
});

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  history: {
    type: [songSchema],
  },
  playlist: {
    type: [playListSchema],
  },
  role: {
    type: String,
    default: "user",
  },
  recommendation: {
    type: String,
    default: null,
  },
});

const Song = mongoose.model("Song", songSchema);
const Playlist = mongoose.model("Playlist", playListSchema);
const User = mongoose.model("User", userSchema);
module.exports = { User, Song, Playlist };
