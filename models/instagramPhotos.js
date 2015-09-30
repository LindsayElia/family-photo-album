//_______REQUIRE DEPENDENCIES_______
var mongoose = require("mongoose");
mongoose.set("debug", true);

//_______DEFINE USER SCHEMA_______
var instagramPhotoSchema = new mongoose.Schema({

});

//_______EXPORT THE USER MODEL_______
var InstagramPhoto = mongoose.model("InstagramPhoto", instagramPhotoSchema);
module.exports = InstagramPhoto;