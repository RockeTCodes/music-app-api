const asyncWrapper = require("../middleware/asyncWrapper");
const { User, Song, Playlist } = require("../models");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const getSongs = async (req, res) => {
  try {
    const songs = await Song.find();
    res.status(200).json({ songs });
  } catch (err) {
    console.log(err);
  }
};

const addSong = asyncWrapper(async (req, res) => {
  try {
    const { name, singer, category } = req.body;
    const files = req.files;

    const file = files.find((file) => file.fieldname === "file").path;
    const cover = files.find((file) => file.fieldname === "cover").path;

    const song = await Song.create({ name, file, singer, category, cover });
    res.status(201).json({ song });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

const searchSongs = async (req, res) => {
  try {
    let songs;

    if (req.query.name) {
      const nameRegex = new RegExp(req.query.name, "i");
      songs = await Song.find({ name: nameRegex });
    }

    if (req.query.singer) {
      const singerRegex = new RegExp(req.query.singer, "i");
      songs = await Song.find({ singer: singerRegex });
    }

    if (req.query.category) {
      const categoryRegex = new RegExp(req.query.category, "i");
      songs = await Song.find({ category: categoryRegex });
    }

    if (!songs || songs.length === 0) {
      res
        .status(200)
        .json({ message: "No song found according to your query." });
    } else {
      res.json({ songs });
    }
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ message: "An error occurred while searching for songs." });
  }
};

const createPlaylist = async (req, res) => {
  try {
    const id = req.user._id;
    const username = req.user.name;
    const newPlaylist = new Playlist({
      user: username,
      name: req.body.playlistName,
    });
    newPlaylist.save();
    User.findOne({ _id: id }, (err, foundUser) => {
      if (!err) {
        foundUser.playlist.push(newPlaylist);
        foundUser.save();
        res.status(200).json({ message: "New playlist created." });
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" }, err);
  }
};

const getUserPlaylist = async (req, res) => {
  try {
    const id = req.user._id;
    const foundUser = await User.findOne({ _id: id });

    if (!foundUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const playlists = foundUser.playlist;

    if (playlists.length === 0) {
      return res.json({ message: "You have not created any Playlist yet." });
    }

    res.json({ playlists });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", err });
  }
};

const addSongToPlaylist = async (req, res) => {
  const id = req.user._id;
  const playlistid = req.body.playlistid;

  const songid = req.body.songid;

  const song = await Song.findOne({ _id: songid });
  try {
    User.findOneAndUpdate(
      { _id: id, "playlist._id": playlistid },
      { $push: { "playlist.$.songs": song } },
      { useFindAndModify: false },
      (err, user) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Song added successfully");
        }
      }
    );

    Playlist.findOne({ _id: playlistid }, (err, foundPlaylist) => {
      foundPlaylist.songs.push(song);
      foundPlaylist.save();
    });
    res.status(200).json({ message: "Song has been added to Playlist." });
  } catch (err) {
    console.log(err);
  }
};

const getPlaylistSongs = async (req, res) => {
  try {
    const playlistId = req.user.playlistid;

    Playlist.findOne({ _id: playlistId }, (err, foundPlaylist) => {
      if (err) {
        res.status(500).json({ message: "Internal Server Error", err });
      } else if (!foundPlaylist) {
        res.status(404).json({ message: "Playlist not found" });
      } else {
        const songs = foundPlaylist.songs;
        res.status(200).json({ songs });
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", err });
  }
};

const getUserHistory = async (req, res) => {
  try {
    const id = req.user._id;
    User.findOne({ _id: id }, (err, foundUser) => {
      const userHistory = foundUser.history;
      res.status(200).json({ userHistory });
    });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", err });
  }
};

const addSongToHistory = async (req, res) => {
  const id = req.user._id;
  const songid = req.body.songid;

  const song = await Song.findOne({ _id: songid });

  User.findOne({ _id: id }, (err, foundUser) => {
    if (!err) {
      foundUser.history.push(song);
      foundUser.recommendation = song.category;
      foundUser.save();

      res.status(200).json({ mesaage: "Song added to your history." });
    }
  });
};

const recommendation = async (req, res) => {
  const recommend = req.user.recommendation;
  if (recommend != null) {
    Song.find({ category: recommend }, (err, foundSoungs) => {
      res.json({ foundSoungs });
    });
  } else {
    Song.find((err, foundSongs) => {
      res.json({ foundSongs });
    });
  }
};

const getSongsForAdmin = async (req, res) => {
  let songs = Song.find();
  res.json({ songs });
};

const updateSong = async (req, res) => {
  const songId = req.body.songid;
  const name = req.body.songname;
  const category = req.body.category;

  try {
    const updatedSong = await Song.findByIdAndUpdate(
      songId,
      { $set: { name: name, category: category } },
      { new: true }
    );

    await User.updateMany(
      { "history._id": songId },
      { $set: { "history.$.name": name, "history.$.category": category } }
    );

    await User.updateMany(
      { "playlist.songs._id": songId },
      {
        $set: {
          "playlist.$[].songs.$[elem].name": name,
          "playlist.$[].songs.$[elem].category": category,
        },
      },
      { arrayFilters: [{ "elem._id": songId }] }
    );

    await Playlist.updateMany(
      { "songs._id": songId },
      {
        $set: {
          "songs.$[elem].name": name,
          "songs.$[elem].category": category,
        },
      },
      { arrayFilters: [{ "elem._id": songId }] }
    );

    res.json({ message: "Song updated successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while updating the song." });
  }
};

const deleteSong = async (req, res) => {
  const songId = req.body.songid;

  try {
    await Song.findByIdAndRemove(songId);

    const users = await User.find({});
    for (let i = 0; i < users.length; i++) {
      const user = users[i];

      user.history = user.history.filter(
        (song) => song._id.toString() !== songId
      );

      user.playlist.forEach((playlist) => {
        playlist.songs = playlist.songs.filter(
          (song) => song._id.toString() !== songId
        );
      });

      await user.save();
    }

    const playlists = await Playlist.find({});
    for (let i = 0; i < playlists.length; i++) {
      const playlist = playlists[i];

      playlist.songs = playlist.songs.filter(
        (song) => song._id.toString() !== songId
      );
      await playlist.save();
    }

    res.json({ message: "Song removed." });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while removing the song." });
  }
};

module.exports = {
  getSongs,
  addSong,
  searchSongs,
  createPlaylist,
  addSongToPlaylist,
  addSongToHistory,
  recommendation,
  updateSong,
  deleteSong,
  getPlaylistSongs,
  getUserPlaylist,
  getUserHistory,
};
