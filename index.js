const connect = require("./connectdb");
connect();
const {
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
} = require("./controllers/songs");
const {
  app,
  register,
  login,
  logout,
  checkLoginStatus,
} = require("./controllers/authentication");
const isAdmin = require("./middleware/isAdmin");
const upload = require("./middleware/multer");
const isAuthenticated = require("./middleware/isAuthenticated");

app.post("/register", register);

app.post("/login", login);

app.post("/logout", logout);

app.get("/checkLoginStatus", checkLoginStatus);

app.get("/songs", getSongs);

app.post("/songs", isAdmin, upload, addSong);

app.get("/search", searchSongs);

app.post("/createPlaylist", isAuthenticated, createPlaylist);

app.post("/addSongToPlaylist", isAuthenticated, addSongToPlaylist);

app.get("/getUserPlaylist", isAuthenticated, getUserPlaylist);

app.post("/getPlaylistSongs", isAuthenticated, getPlaylistSongs);

app.post("/getUserHistory", isAuthenticated, getUserHistory);

app.post("/addSongToHistory", isAuthenticated, addSongToHistory);

app.get("/recommendedsongs", isAuthenticated, recommendation);

app.post("/updateSong", isAdmin, updateSong);

app.post("/deleteSong", isAdmin, deleteSong);

app.listen(process.env.PORT || 5000, () => {
  console.log("Server Started.......");
});
