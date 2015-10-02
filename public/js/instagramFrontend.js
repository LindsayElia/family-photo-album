console.log("hello from instagram frontend js file");

$(document).ready(function(){
	$("#goToInstagramLanding").hide();

	$("#instagramAuthButton").on("click", function(){
		$("#goToInstagramLanding").show();
		$("#instagramAuthButton").hide();
	});

});