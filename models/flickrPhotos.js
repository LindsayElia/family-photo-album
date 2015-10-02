//_______REQUIRE DEPENDENCIES_______
var mongoose = require("mongoose");
mongoose.set("debug", true);

//_______DEFINE USER SCHEMA_______
var flickrPhotoSchema = new mongoose.Schema({
	flickrPhotoId: { 
		type: String,
		unique: true
	},
	flickrPhotoSecret: String,
	owner: {				// photo belongs to a single user
		type: mongoose.Schema.Types.ObjectId,
        ref: "User"
	},
	createdTime: String,	// default to false?
	urlFullSize: String,
	urlThumbnail: String,
	place: String, 			// build out an object?
	tags: String
});

//_______EXPORT THE USER MODEL_______
var FlickrPhoto = mongoose.model("FlickrPhoto", flickrPhotoSchema);
module.exports = FlickrPhoto;
