 axios.post('https://'+req.params.host+'/idp/'+req.params.tenant+'/authn/token', {
    grant_type:req.params.grant_type,    
    username: req.params.username,
    password:req.params.password,
  }, {
    auth:{
      username: req.params.client_id,
      password:req.params.client_secret,
    },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    }
  }
).then(function(response){
  

  res.send(response.data.access_token);
})