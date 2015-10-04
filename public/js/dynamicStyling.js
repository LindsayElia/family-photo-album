console.log("hello from dynamicStyling frontend js file");


$(document).ready(function(){


	$("#my-account-navbar-button").on("mouseenter", function(){
		$(".flyout-menu").css("visibility", "visible");
		$(".flyout-menu-logo-nav").css("visibility", "visible");
	});

	$(".inner-flyout-menu-container").on("mouseleave", function(){
		$(".flyout-menu").css("visibility", "hidden");
		$(".flyout-menu-logo-nav").css("visibility", "hidden");
	});






});