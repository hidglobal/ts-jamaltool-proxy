const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
var cors = require('cors');
const req = require('express/lib/request');
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.post('/conng',(req,res)=>{
    let data = req.body;
    let hostname = req.body.hostname;
    let tenant = req.body.tenant;
    let grant_type = req.body.grant_type;
    let username = req.body.username;
    let password = req.body.password;
    let client_id = req.body.client_id;
    let client_secret = req.body.client_secret;
    if( hostname !== '' && tenant !== ''){
        axios.post('https://'+hostname+'/idp/'+tenant+'/authn/token', {
            grant_type:grant_type,    
            username: username,
            password:password,
          }, {
            auth:{
              username: client_id,
              password:client_secret,
            },
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            }
          }
        ).then(function(response){
          res.send(response?.data);
          console.log(response?.data);
        }).catch(function(error){
           console.log(error);
           //(!!error.response.data ? res.send(error.response.data): console.log('error!'))
           res?.send(error?.response?.data)
           
        });
    }
    /*
    
*/
    //res.send('Data: '+ JSON.stringify(data));
});

app.post("/users",(req,res)=>{
  let hostname = req.body.hostname;
  let tenant = req.body.tenant;
  let access_token = req.body.access_token.replace(/(\r?\n|\r)/gm,"");
// Users/.search endpoint with POST and containing a JSON payload to list USERs 
axios.post("https://"+hostname+"/scim/" + tenant+ "/v2/Users/.search",

JSON.stringify(
  {
    "schemas" : [
      "urn:ietf:params:scim:api:messages:2.0:SearchRequest"
    ],
    
    "filter" : "groups eq \"" + "UG_ROOT" + "\"", // fetching from the root group => fetch all users 
    
    "sortBy" : "id",
    "sortOrder" : "descending",
    "startIndex" : 0, // this can be used to create paged UIs
    "count" : 100 // (the top limit is a 100, it is impossible to retrieve more within a single request) 
  }
),
{
  headers : {
    "Content-Type" : "application/scim+json",
    "Authorization" : `Bearer ${access_token}`
  }
}
).then(function(response) {

// IMPORTANT: the data is in "resources"
userList = response.data.resources;

// JUST FOR JAVASCRIPT:
// the way the authenticators are returned makes it difficult with angular JS notation, we just transfer the data in 
// a more convenient field of the User object here. 
for (var index in userList) {

  // putting authenticators in a simple sub object 
  userList[index].authenticators = userList[index]["urn:hid:scim:api:idp:2.0:UserAuthenticator"].authenticators;

  // putting attributes in a simple sub object (mapped by attribute name)
  // note that the first name, last name, email are also retrieved as attributes 

  // from [0 => EMAIL = test@mail.fr, 1 => TITLE = Mr]
  // to {EMAIL => test@mail.fr, TITLE => Mr }

  var attributesIndexed = userList[index]["urn:hid:scim:api:idp:2.0:UserAttribute"].attributes;
  var attributesMappedByName = {};

  for (indexAttributes in attributesIndexed) {
    attributesMappedByName[attributesIndexed[indexAttributes].name] = attributesIndexed[indexAttributes];
  }

userList[index].attributes = attributesMappedByName;


}
console.log(userList);
res.send(userList);

}, function(error) {
console.log(error);
})
});


app.post("/register",(req,res)=>{

  let hostname = req.body.hostname;
  let tenant = req.body.tenant;
  let access_token = req.body.access_token.replace(/(\r?\n|\r)/gm,"");
  let userEmail = req.body.email;
  let userFamily = req.body.familyName;
  let userFirstname = req.body.firstName;
  let userTitle = req.body.Title;
  let userPhone = req.body.Phone;
  console.log(access_token);
  // Users endpoint with POST and containing a JSON payload to create a USER 
  axios.post("https://"+hostname+"/scim/" +tenant+ "/v2/Users?api-version=2",

    JSON.stringify({
      "schemas" : [
        "urn:ietf:params:scim:schemas:core:2.0:User",
        "urn:hid:scim:api:idp:2.0:Attribute",
        "urn:hid:scim:api:idp:2.0:UserDevice"
      ],
      "externalId" : userEmail, // could be an auto generated ID 
      "name" : {
        "familyName" : userFamily,
        "givenName" : userFirstname
      },
      "emails" : [ {
        "value" : userEmail,
        "type" : "work"
      } ],
      "groups" : [ {
        "value" : "UG_ROOT" // all users will be created in one root group on AaaS, the permissions are managed through roles  
      } ],
      "urn:hid:scim:api:idp:2.0:UserAttribute" : {
        "attributes" : [ { // can provide attributes here
          "name" : "TITLE",
          "type" : "string",
          "value" : userTitle
        },
          {
            "name" : "ATR_MOBILE",
            "type" : "string",
            "value" : userPhone
          }
        ]
        // Possible attributes : 
        // ADDRESS1		
        // ADDRESS2		
        // ADDRESS3		
        // ADDRESS4		
        // CITY		
        // DOB => Date of birth 			
        // ATR_MOBILE		
        // POSTCODE		
        // TITLE

      },
      "meta" : {
        "resourceType" : "User"
      }
    }),
    {
      headers : {
        "Content-Type" : "application/scim+json",
        "Authorization" : `Bearer ${access_token}`// bearer token from OPENID
      }
    }
  ).then(function(response) {

    // Retrieving the internal ID of the user, which can be used later to request the detail of the User with SCIM. 
    let createdUserId = response.data.id;
    
    let messageUser = 'The User was created with the id: ' + createdUserId;
    res.send(messageUser)
    // Refresh the list of users ! 
  })
  .catch(function(error){
    console.log(error.cause);
    let messageUserError = "Impossible to create the user : ";

    if (error?.data?.detail) {
      messageUserError += JSON.stringify(error?.data?.detail);
    }

    if (error?.data?.scimType) {
      messageUserError += " (" + JSON.stringify(error?.data?.scimType) + ")";
    }
    res.send(error);
  });

});
app.post("/createAuthenticator",(req,res)=>{
		
  //initializing  
  let hostname = req.body.hostname;
  let tenant = req.body.tenant;
  let access_token = req.body.access_token.replace(/(\r?\n|\r)/gm,"");
  let userId = req.body.Email;
  let passwordAuth = req.body.Password;
  let policy = req.body.policy;
  //console.log(passwordAuthenticator);
  createAuthenticatorData = null;
  createAuthenticatorDataError = null;
  resetPasswordData = null;
  resetPasswordDataError = null;
  enableAuthenticatorData = null;
  enableAuthenticatorDataError = null;
  disableAuthenticatorData = null;
  disableAuthenticatorDataError = null;
  listOfAuthenticatorsDataError = null;
  listOfAuthenticators = null;
  
  //find a User by externalId for whom an Authenticator will be created 
  //The result will be in JSON and will contain arrays of users
  
  axios.post("https://"+hostname+"/scim/" + tenant + "/v2/Users/.search",
    JSON.stringify({
      "schemas" : [
        "urn:ietf:params:scim:api:messages:2.0:SearchRequest"
      ],
      "filter" : "externalId eq \""+ userId + "\""// we pass the external ID of the user 
    }),
    {
      headers : {
        "Content-Type" : "application/scim+json",
        "Authorization" : `Bearer ${access_token}` // bearer token from OPENID
      }
    }
  )
    .then(function(response) {
      //if user was found, then Authenticator will be created, otherwise we will get error
      if (response.data.resources.length > 0) {
        //createAuthenticatorRequest(response.data.resources[0].id, nameAuthenticator);
        idUser = response.data.resources[0].id;
          axios.post("https://"+hostname+"/scim/" + tenant + "/v2/Authenticator",
            JSON.stringify({
              "schemas" : [
                "urn:hid:scim:api:idp:2.0:Authenticator"
              ],
              "policy" : {
                "value" : policy
              },
              "status" : {
                "status" : "ENABLED",
                "expiryDate" : "2040-05-15T18:15:21+00:00",
                "startDate" : "2015-05-15T18:15:21+00:00"
              },
              "owner" : {
                "value" : idUser // the internal ID of the user (!= external ID), this ID is retrieved via the Users search endpoint
              },
              "urn:hid:scim:api:idp:2.0:Password" : {
                "username" : userId,
                "password" :passwordAuth// no need to URL encode here, because of the content type of the request
              }
            }),
            {
              headers : {
                "Content-Type" : "application/scim+json",
                "Authorization" :  `Bearer ${access_token.replace(/(\r?\n|\r)/gm,"")}`
              }
            }
          ).then(function(response) {
              
              createAuthenticatorData = "Successfully created password authenticator for " + userId + " user.";
              res.send(createAuthenticatorData);
              console.log(createAuthenticatorData);
              console.log(response);
            }, function(error) {
              res?.send(error?.response?.data)
              console.log(error?.response?.data);
            });
        
      } else {
        createAuthenticatorDataError = "There are no User with id: " + userId ;//+ nameAuthenticator;
        res.send(createAuthenticatorDataError);
      }
    }, function(error) {
      createAuthenticatorDataError = error;
      res.send(createAuthenticatorDataError);
    });

  });

// create OTP authenticator
  app.post("/createotpAuthenticator",(req,res)=>{
		
    //initializing  
    let hostname = req.body.hostname;
    let tenant = req.body.tenant;
    let access_token = req.body.access_token.replace(/(\r?\n|\r)/gm,"");
    let userId = req.body.Email;
    //console.log(passwordAuthenticator);
    createAuthenticatorData = null;
    createAuthenticatorDataError = null;
    resetPasswordData = null;
    resetPasswordDataError = null;
    enableAuthenticatorData = null;
    enableAuthenticatorDataError = null;
    disableAuthenticatorData = null;
    disableAuthenticatorDataError = null;
    listOfAuthenticatorsDataError = null;
    listOfAuthenticators = null;
    
    //find a User by externalId for whom an Authenticator will be created 
    //The result will be in JSON and will contain arrays of users
    
    axios.post("https://"+hostname+"/scim/" + tenant + "/v2/Users/.search",
      JSON.stringify({
        "schemas" : [
          "urn:ietf:params:scim:api:messages:2.0:SearchRequest"
        ],
        "filter" : "externalId eq \""+ userId + "\""// we pass the external ID of the user 
      }),
      {
        headers : {
          "Content-Type" : "application/scim+json",
          "Authorization" : `Bearer ${access_token}` // bearer token from OPENID
        }
      }
    )
      .then(function(response) {
        //if user was found, then Authenticator will be created, otherwise we will get error
        if (response.data.resources.length > 0) {
          //createAuthenticatorRequest(response.data.resources[0].id, nameAuthenticator);
          //res.send(response.data.resources[0].id);
          idUser = response.data.resources[0].id;
            axios.post("https://"+hostname+"/scim/" + tenant + "/v2/Authenticator",
              JSON.stringify({
                "schemas" : [
                  "urn:hid:scim:api:idp:2.0:Authenticator"
                ],
                "policy" : {
                  "value" : "AT_OTP"
                },
                "status" : {
                  "status" : "ENABLED",
                  "expiryDate" : "2040-05-15T18:15:21+00:00",
                  "startDate" : "2015-05-15T18:15:21+00:00"
                },
                "owner" : {
                  "value" : idUser // the internal ID of the user (!= external ID), this ID is retrieved via the Users search endpoint
                }
              }),
              {
                headers : {
                  "Content-Type" : "application/scim+json",
                  "Authorization" :  `Bearer ${access_token.replace(/(\r?\n|\r)/gm,"")}`
                }
              }
            ).then(function(response) {
                
                createAuthenticatorData = "Successfully created OTP authenticator for " + userId + " user.";
                res.send(response.data);
                console.log(createAuthenticatorData);
                console.log(response);
              }, function(error) {
                res.send(error.response.data);
                console.log(error);
              });
          
        } else {
          createAuthenticatorDataError = "There are no User with id: " + userId ;//+ nameAuthenticator;
          res.send(createAuthenticatorDataError);
        }
      }, function(error) {
        createAuthenticatorDataError = error.response.data;
        res.send(createAuthenticatorDataError);
      });
  
    });
  
// Test Password Authenticator.

app.post('/passauth',(req,res)=>{
  let userName = req.body.username;
  let password = req.body.password;
  let hostname = req.body.hostname;
  let tenant = req.body.tenant;
  let client_id = req.body.client_id;
  let client_secret = req.body.client_secret;
  //let access_token = req.body.access_token.replace(/(\r?\n|\r)/gm,"");
  axios.post('https://'+hostname+'/idp/'+tenant+'/authn/token', 
  "grant_type=client_credentials&client_id=" + client_id + "&client_secret=" + client_secret,
 {
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    //"Authorization" : `Bearer ${access_token}` // bearer token from OPENID
  }
}
).then(function(response) {
  client_token = response.data.access_token; 
      axios.post('https://'+hostname+'/idp/'+tenant+'/authn/token',  {
        grant_type:'password',    
        username: userName,
        password:password,
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          "Authorization" : `Bearer ${client_token}` // bearer token from OPENID
        }
      }
    ).then(function(response){
      res.send(response?.data);
      console.log(response?.data);
    }).catch(function(error){
       console.log(error);
       //(!!error.response.data ? res.send(error.response.data): console.log('error!'))
       res?.send(error?.response?.data)
       
    });

  }, function(error) {
    res?.send(error?.response?.data)
  });


});

// Clone a device to allow rooted device type.

app.post('/clonedevice',(req,res)=>{
  let userName = req.body.username;
  let password = req.body.password;
  let hostname = req.body.hostname;
  let tenant = req.body.tenant;
  let client_id = req.body.client_id;
  let client_secret = req.body.client_secret;
  let access_token = req.body.access_token.replace(/(?:\\[rn]|[\r\n]+)+/g, "");
  let cPayload = req.body.cPayload;
  axios.post('https://'+hostname+'/configuration/'+tenant+'/v2/Device/Type/?api-version=8',cPayload,
 {
  headers: {
    'Content-Type': 'application/scim+json',
    "Authorization" : `Bearer ${access_token}` // bearer token from OPENID
  }
}
).then(function(response) {
  console.log(response.data)
res.send(response.data);
  }, function(error) {
    DataError = error;
    console.log(error.data);
    res?.send(error?.response?.data)
  });


});
// Create a device
app.post('/createdevice',(req,res)=>{
  let hostname = req.body.hostname;
  let tenant = req.body.tenant;
  let client_id = req.body.client_id;
  let client_secret = req.body.client_secret;
  let access_token = req.body.access_token.replace(/(?:\\[rn]|[\r\n]+)+/g, "");
  let body = req.body.bPayload;
  console.log(access_token);
  axios.post('https://'+hostname+'/scim/'+tenant+'/v2/Device/?api-version=7',body,
 {
  headers: {
    'Content-Type': 'application/scim+json',
    "Authorization" : `Bearer ${access_token}` // bearer token from OPENID
  }
}
).then(function(response) {
  console.log(response);
  res.send(response.data);
  }, function(error) {
    console.log(error);
    res?.send(error?.response?.data)
  });

});

// Get a known device
app.post('/getdevice',(req,res)=>{
  let hostname = req.body.hostname;
  let tenant = req.body.tenant;
  let access_token = req.body.access_token.replace(/(?:\\[rn]|[\r\n]+)+/g, "");
  let deviceID = req.body.deviceID;
console.log(access_token);
   axios.get('https://'+hostname+'/scim/'+tenant+'/v2/Device/'+deviceID+'?api-version=7',
 {
  headers: {
    'Content-Type': 'application/scim+json',
    "Authorization" : `Bearer ${access_token}` // bearer token from OPENID
  }
}
).then(function(response) {
  console.log(response);
  res.send(response.data);
  }, function(error) {
    console.log(error);
    res?.send(error?.response?.data)
  });

});
// Assign a device to a user
app.post('/assigndevice',(req,res)=>{
  let hostname = req.body.hostname;
  let tenant = req.body.tenant;
  let access_token = req.body.access_token.replace(/(?:\\[rn]|[\r\n]+)+/g, "");
  let deviceID = req.body.deviceID;
  let jPayload = req.body.cPayload;
   axios.put('https://'+hostname+'/scim/'+tenant+'/v2/Device/'+deviceID+'?api-version=7',jPayload,
 {
  headers: {
    'Content-Type': 'application/scim+json',
    "Authorization" : `Bearer ${access_token}` // bearer token from OPENID
  }
}
).then(function(response) {
  console.log(response);
  res.send(response.data);
  }, function(error) {
    console.log(error);
    res?.send(error?.response?.data)
  });

});
// Provision device
app.post('/provisiondevice',(req,res)=>{
  let hostname = req.body.hostname;
  let tenant = req.body.tenant;
  let access_token = req.body.access_token.replace(/(?:\\[rn]|[\r\n]+)+/g, "");
  let body = req.body.cPayload;
  axios.post('https://'+hostname+'/scim/'+tenant+'/v2/Device/Provision/?api-version=7',body,
 {
  headers: {
    'Content-Type': 'application/scim+json',
    "Authorization" : `Bearer ${access_token}` // bearer token from OPENID
  }
}
).then(function(response) {
  console.log(response);
  res.send(response.data);
  }, function(error) {
    console.log(error);
    res?.send(error?.response?.data)
  });

});

// Search for Device type and External ID.
app.post('/sdevice',(req,res)=>{
  let hostname = req.body.hostname;
  let tenant = req.body.tenant;
  let access_token = req.body.access_token.replace(/(\r?\n|\r)/gm,"");
  let sPayload = req.body.sdevicePayload;
  axios.post('https://'+hostname+'/scim/'+tenant+'/v2/Device/.search',sPayload,
 {
  headers: {
    'Content-Type': 'application/scim+json',
    "Authorization" : `Bearer ${access_token}` // bearer token from OPENID
  }
}
).then(function(response) {
  console.log(response.data)
res.send(response.data)
  }, function(error) {
    DataError = error.message;
    console.log(error);
    res?.send(error?.response?.data)
  });


});

// Assign Device
app.post('/asdevice',(req,res)=>{
  let hostname = req.body.hostname;
  let tenant = req.body.tenant;
  let access_token = req.body.access_token.replace(/(\r?\n|\r)/gm,"");
  let sPayload = req.body.adevicePayload;
  let deviceID = req.body.deviceiID;
  axios.put('https://'+hostname+'/scim/'+tenant+'/v2/Device/'+deviceID,sPayload,
 {
  headers: {
    'Content-Type': 'application/scim+json',
    "Authorization" : `Bearer ${access_token}` // bearer token from OPENID
  }
}
).then(function(response) {
  console.log(response.data)
res.send(response.data)
  }, function(error) {

    res?.send(error?.response?.data)
  });


});

// OTP Authentication

app.post('/otpauth',(req,res)=>{
  let hostname = req.body.hostname;
  let tenant = req.body.tenant;
  let username = req.body.username;
  let otppassword = req.body.password1;
  let client_id = req.body.client_id;
  let client_secret = req.body.client_secret;
  if( hostname !== '' && tenant !== ''){
      axios.post('https://'+hostname+'/idp/'+tenant+'/authn/token', {
        mode:'SYNCHRONOUS',
        authType:'AT_OTP',
        grant_type:'password',
        username:username,
        password:otppassword,
        client_id:client_id,
        client_secret:client_secret,
        
        }, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          }
        }
      ).then(function(response){
        res.send(response?.data);
        console.log(response?.data);
      }).catch(function(error){
         console.log(error);
         res?.send(error?.response?.data)         
      });
  }
});
app.listen(4000,()=>{
    console.log('listening on port 4000')
})
