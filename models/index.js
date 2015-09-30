var mongoose = require("mongoose");
require('dotenv').load();

mongoose.connect(process.env.MONGOLAB_URI || "mongodb://localhost/family_photos_app");

mongoose.set("debug", true);

module.exports.Group = require("./group");
module.exports.User = require("./user");
module.exports.FacebookPhoto = require("./facebookPhotos");
module.exports.InstagramPhoto = require("./instagramPhotos");
