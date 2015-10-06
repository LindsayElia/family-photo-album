//_______REQUIRE DEPENDENCIES_______
var mongoose = require("mongoose");
mongoose.set("debug", true);


//_______DEFINE USER SCHEMA_______
var facebookPhotoSchema = new mongoose.Schema({
	facebookPhotoId: { 
		type: String,
		unique: true
	},
	owner: {				// photo belongs to a single user
		type: mongoose.Schema.Types.ObjectId,
        ref: "User"
	},
	groupId: String,
	createdTime: String,	// default to false?
	album: String, 			// build out an object?
	urlFullSize: String,
	urlThumbnail: String,
	urlMidSize: String,
	place: String, 			// build out an object?
	tags: String			// build out an object?
});

//_______EXPORT THE USER MODEL_______
var FacebookPhoto = mongoose.model("FacebookPhoto", facebookPhotoSchema);
module.exports = FacebookPhoto;
