//_______REQUIRE DEPENDENCIES_______
var mongoose = require("mongoose");
mongoose.set("debug", true);


//_______DEFINE USER SCHEMA_______
var instagramPhotoSchema = new mongoose.Schema({
	instagramPhotoId: { 
		type: String,
		unique: true
	},
	owner: {				// photo belongs to a single user
		type: mongoose.Schema.Types.ObjectId,
        ref: "User"
	},
	groupId: {			// user belongs to a single group
		type: mongoose.Schema.Types.ObjectId,
        ref: "Group"
	},
	createdTime: String,	// default to false?
	urlFullSize: String,
	urlThumbnail: String,
	place: String, 			// build out an object?
	tags: String			// build out an object?
});

//_______EXPORT THE USER MODEL_______
var InstagramPhoto = mongoose.model("InstagramPhoto", instagramPhotoSchema);
module.exports = InstagramPhoto;
