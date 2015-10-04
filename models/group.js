//_______REQUIRE DEPENDENCIES_______
var mongoose = require("mongoose");
mongoose.set("debug", true);
var User = require('./user');

var date = new Date();
var dateGroupCreated = (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear().toString().substr(2,2);


//_______DEFINE USER SCHEMA_______
var groupSchema = new mongoose.Schema({
	groupUrlName: {
		type: String,
		unique: true
	},
	groupDisplayName: String,
	groupMembers: [{			// one group has many users
		type: mongoose.Schema.Types.ObjectId,
		ref: "User"
	}],
	groupCreatedTime: {
		type: String, 
		default: dateGroupCreated
	}
});

//_______EXPORT THE USER MODEL_______
var Group = mongoose.model("Group", groupSchema);
module.exports = Group;