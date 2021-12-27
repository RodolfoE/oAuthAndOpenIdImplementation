const express = require('express');
const { Provider } = require('oidc-provider');
const path = require('path');

const app = express();

//Middlewares
app.use(express.static(__dirname + '/public'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const configuration = {
 
  clients: [{
     client_id: "oidcCLIENT",      
     client_secret: "Some_super_secret",      
     grant_types: ["authorization_code"],      
     redirect_uris: [ 'http://localhost:8080/login/callback', "https://oidcdebugger.com/debug"], 
     response_types: ["code",],  
       
   //other configurations if needed
  }],
  pkce: {
    required: () => false,
  },
};

const oidc = new Provider('http://localhost:3000', 
  { adapter: class myAdapter{

    /**
     * Called to find params for the client_id
     * @param  {...any} args 
     */
    find = (...args) => {
      console.log('find', args);
      return {
        client_id: "oidcCLIENT",      
        client_secret: "Some_super_secret",      
        grant_types: ["authorization_code"],      
        redirect_uris: [ 'http://localhost:8080/login/callback', "https://oidcdebugger.com/debug"], 
        response_types: ["code",]
     };
    }

    /**
     * Called after client_id gets checked
     * @param  {...any} args 
     */
    upsert = (_id, payload, expiresIn) => {
      console.log('upsert', args);
      return args[1];
    }
    findByUserCode = (...args) => {
      console.log('findByUserCode', args);
      return {
        client_id: "oidcCLIENT",      
        client_secret: "Some_super_secret",      
        grant_types: ["authorization_code"],      
        redirect_uris: [ 'http://localhost:8080/login/callback', "https://oidcdebugger.com/debug"], 
        response_types: ["code",]
     }
    }
    findByUid = (...args) => {
      console.log('findByUid', args);
      return {
        client_id: "oidcCLIENT",      
        client_secret: "Some_super_secret",      
        grant_types: ["authorization_code"],      
        redirect_uris: [ 'http://localhost:8080/login/callback', "https://oidcdebugger.com/debug"], 
        response_types: ["code",]
     }
    }
    destroy = (...args) => {
      console.log('destroy', args);
    }
    revokeByGrantId = (...args) => {
      console.log('revokeByGrantId', args);
    }
  },
    configuration
  } );

app.use("/oidc",oidc.callback());

app.listen(3000, function () {
  console.log('OIDC is listening on port 3000!');
});