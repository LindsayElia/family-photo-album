console.log("hello from flickr frontend js file");

$(document).ready(function(){
	$("#goToFlickrLanding").hide();

	$("#flickrAuthButton").on("click", function(){
		$("#goToFlickrLanding").show();
		$("#flickrAuthButton").hide();
	});

});