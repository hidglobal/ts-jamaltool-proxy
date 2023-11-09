/***********************************************************
	 * BEGINNING OF STEP 1.1 : Verify that the user exists
	 **********************************************************/
	
	//First step for the creation of the push Device is to make sure that the user exist:
	$scope.createPush = function(){
		$scope.messageCreateDevicePush = "";
		$scope.messageCreateDevicePushError = "";
		$scope.temp_devideId = ""
			
			
			$http.post("http://localhost:8080/proxy/scim/"+ $scope.Orgdomain+ "/v2/Users/.search",
					JSON.stringify({
						"schemas" : [ "urn:ietf:params:scim:api:messages:2.0:SearchRequest" ],
						"filter" : "username eq "
							+ $scope.user.externalID
					}),
					{
						headers : {
							"Content-Type" : "application/scim+json",
							"Authorization" : $window.parent.customerDataToken
							// bearer token from OPENID
						}
					})
					.then(
							function(response) {
								if (response.data.resources.length > 0) {
									$scope.searchUsers = response.data.resources;
									//We are retrieving the Id of the user
									$scope.userPushId = $scope.searchUsers[0].id;
									$scope.messageCreateDevicePush += (" User id is : " + $scope.userPushId);
									//If the user exist, create the device
									$scope.createDT_TDS_V4Function();
								} else {
									$scope.messageCreateDevicePushError = "No user found with this id";

								}
							},
							function(error) {
								console.log(error);
								$scope.messageCreateDevicePushError = "Impossible to get user details : ";

								if (error.data.detail) {
									$scope.messageCreateDevicePushError += error.data.detail;
								}

								if (error.data.scimType) {
									$scope.messageCreateDevicePushError += " ("
										+ error.data.scimType
										+ ")";
								}

							});
	}
/***********************************************************
	 * BEGINNING OF STEP 1.2 : Create the Mobile push-based Validation device for the user. 
	 **********************************************************/
	
	//Function to create the device of the type DT_TDS_V4
	$scope.createDT_TDS_V4Function = function() {
		
		//generate a random number
		$scope.generateNumber()
		// re-init messages
		$scope.messageUser = "";
		$scope.messageUserError = "";
		$scope.temp_devideId = ""

		// Users endpoint with POST and containing a JSON
		// payload to create a USER
		$http.post("http://localhost:8080/proxy/scim/"+ $scope.Orgdomain+ "/v2/Device",
			JSON.stringify({
				"schemas" : [ "urn:hid:scim:api:idp:2.0:Device" ],
				//External Id of the device. In this example it is composed of the externalId of the user and a random number.
				"externalId" : $scope.user.externalID
				+ "-"+$scope.randomNumber,
				//Type of the device to use
				"type" : $scope.device.devicetype,
				"status" : {
					//The status when creating the device is PENDING
					"status" : "PENDING",
					"active" : false,
					"expiryDate" : "2040-11-30T11:54:31+0100",
					"startDate" : "2017-11-30T11:54:31+0100"
				}

			}),
			{
				headers : {
					"Content-Type" : "application/scim+json",
					"Authorization" : $window.parent.customerDataToken
					// bearer token from OPENID
				}
			})
			.then(
			function(response) {
				//Retrieve the ID of the device that was created
				$scope.devicePushId = response.data.id;
				$scope.messageCreateDevicePush = 'The Device was created with the id: '
					+ $scope.devicePushId;
				//Bind the device to the user
				$scope.createBindDeviceFunction()
			},
			function(error) {
				console.log(error);
				$scope.messageCreateDevicePushError = "Impossible to create the device : ";

				if (error.data.detail) {
					$scope.messageCreateDevicePushError += error.data.detail;
				}

				if (error.data.scimType) {
					$scope.messageCreateDevicePushError += " ("
						+ error.data.scimType
						+ ")";
				}

			});

	}
	
	
	/***********************************************************
	 * END OF STEP 1.2 : Create the Mobile push-based Validation device for the user. 
	 **********************************************************/

	
	
	/***********************************************************
	 * BEGINNING OF STEP 1.3 : Bind the device created to the user
	 **********************************************************/
	
	// Function to bind the device created to the user
	$scope.createBindDeviceFunction = function() {

		// re-init messages
		$scope.messageUser = "";
		$scope.messageUserError = "";

		$http.put("http://localhost:8080/proxy/scim/"+ $scope.Orgdomain+ "/v2/Device/"+ $scope.devicePushId,
				JSON.stringify({
					"schemas" : [ "urn:hid:scim:api:idp:2.0:Device" ],
					//Id of the device created before
					"id" : $scope.devicePushId,
					//External id of the device created before
					"externalId" : $scope.user.externalID
					+ "-"+$scope.randomNumber,
					//External id of the user to bind the device to
					"owner" : {
						"display" : $scope.user.externalID
					},
					"status" : {
						//The status when creating the device is PENDING
						"status" : "PENDING",
						"active" : false,
						"expiryDate" : "2025-11-30T11:54:31+0100",
						"startDate" : "2017-11-30T11:54:31+0100"
					}

				}),
				{
					headers : {
						"Content-Type" : "application/scim+json",
						"Authorization" : $window.parent.customerDataToken
						// bearer token from OPENID
					}
				})
				.then(
						function(response) {

							$scope.messageCreateDevicePush += (" Bind is successfull ");

							$scope
							.createDeviceProvisionFunction();
						},
						function(error) {
							console.log(error);
							$scope.messageCreateDevicePushError = "Impossible to bind the device : ";

							if (error.data.detail) {
								$scope.messageCreateDevicePushError += error.data.detail;
							}

							if (error.data.scimType) {
								$scope.messageCreateDevicePushError += " ("
									+ error.data.scimType
									+ ")";
							}

						});
	};

	
	
	/***********************************************************
	 * END OF STEP 1.3 : Bind the device created to the user
	 **********************************************************/
		
	
	/***********************************************************
	 * BEGINNING OF STEP 1.4 : Submit a device request for the user
	 * 
	 * Creation of the device issuance request:
	 * Device of type DT_TDSV4
	 * For authentication type AT_SMK
	 * For user the user selected

	 **********************************************************/
	// Initialize the configuration of the device
	// The response of this step will be the QR code that will be scan by the phone of the user

	$scope.createDeviceProvisionFunction = function() {

		// re-init messages
		$scope.messageUser = "";
		$scope.messageUserError = "";

		$http.post("http://localhost:8080/proxy/scim/"+ $scope.Orgdomain+ "/v2/Device/Provision",
				JSON.stringify({
					"schemas" : [ "urn:hid:scim:api:idp:2.0:Provision" ],
					//Type of the device
					"deviceType" : $scope.device.devicetype,
					"description" :
						//Device Id
						"did="+ $scope.devicePushId+ "," +
						//Url that will be use for the phone to be able to communicate with 4tress to finalize the creation of the Push
						"url="+ $scope.serviceURL+ ":"+ $scope.servicePort+ "/"+ $scope.Orgdomain+ "," +
						//These are the default parameters, no need to change them
						"pch=CH_TDSPROV,pth=AT_TDSOOB,pct=CT_TDSOOB,pdt=DT_TDSOOB,"+
						//this url and token is used for getting ciba notification when user will register 
						"cb_url="+ $scope.callbackurl +",cb_notif_token=8d67dc78-7faa-4d41-aabd-67707b374255,mod=GEN,sec=",
						//Id of the user
						"owner" : {
							"value" : $scope.userPushId
						},
						//Attribute mandatory
						"attributes" : [ {
							"name" : "AUTH_TYPE",
							"value" : "AT_SMK",
							"readOnly" : false
						} ]
				}),
				{
					headers : {
						"Content-Type" : "application/scim+json",
						"Authorization" :  $window.parent.customerDataToken
						// bearer token from OPENID
					}
				})
				.then(
						function(response) {

							// The response attribute PROV_MSG
							// contains information to bootstrap
							// the device registration
							$scope.bootstrap = response.data.attributes[0].value;
							$scope.bootstrapJson = JSON.parse($scope.bootstrap);

							$scope.bootstrapUserID = $scope.bootstrapJson.uid;
							$scope.bootstrapInviteCode = atob($scope.bootstrapJson.pss);
							$scope.bootstrapServiceURL = $scope.bootstrapJson.url;

							$scope.messageCreateDevicePush = 'The push device is ready to be registered ';
							
						},
						function(error) {
							console.log(error);
							$scope.messageCreateDevicePush = "Impossible to create the user : ";

							if (error.data.detail) {
								$scope.messageCreateDevicePushError += error.data.detail;
							}

							if (error.data.scimType) {
								$scope.messageCreateDevicePushError += " ("
									+ error.data.scimType
									+ ")";
							}

						});

	};
