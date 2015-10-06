
app.controller("BaseController", function($scope, $http, $location){

	$scope.message = "hello just testing from the angular controller BaseController";

});

app.controller("FacebookPhotoPreviewAll", function($scope, $http, $location){

	// get data from my server
	$http.get('/users/:user_id/landing/facebook').then(function(response){
		console.log("inside of FacebookPhotoPreviewAll angular controller");
		var myData = response.data.fbphotodata;
		console.log("fbphotodata >>", myData);

		var fbPhotoThumbsArrayAll = [];
		for (var i = 0; i < myData.length; i++){
			var fbMidSizeUrl = myData[i].urlMidSize;
			fbPhotoThumbsArrayAll.push(fbMidSizeUrl);
		}

		$scope.photos = fbPhotoThumbsArrayAll;
		console.log("$scope.photos >> ", $scope.photos);


		var fbPhotoThumbsEight = [];
		for (var j = 0; j < 8; j++){
			var thisUrl = myData[j].urlMidSize;
			fbPhotoThumbsEight.push(thisUrl);
		}

		$scope.photosEight = fbPhotoThumbsEight;
		console.log("$scope.photosEight >> ", $scope.photosEight);


		var fbPhotoFullSizeAll = [];
		for (var i = 0; i < myData.length; i++){
			var fbFullSizeUrl = myData[i].urlFullSize;
			fbPhotoFullSizeAll.push(fbFullSizeUrl);
		}

		$scope.photosFullSize = fbPhotoFullSizeAll;
		console.log("$scope.photosFullSize >> ", $scope.photosFullSize);


	});


});