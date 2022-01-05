const express = require('express');
const { now } = require('lodash');
const { Provider } = require('oidc-provider');
const path = require('path');
const adapter = require('./adapters/general.js')
const app = express();

//Middlewares
app.use(express.static(__dirname + '/public'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const configuration = require('./support/configuration');

const oidc = new Provider('http://localhost:3000',  { adapter, ...configuration} );

app.use("/oidc",oidc.callback());

app.get('/view/:viewName', (req, res) => {
  res.render(req.params.viewName, { uid: req.query.jti });
});

app.get('/interaction/:uid', async (req, res, next) => {
  const details = await oidc.interactionDetails(req, res);
  console.log(details);

  switch(details.prompt.name){
    case 'login':
      res.statusCode = 303; // eslint-disable-line no-param-reassign
      res.setHeader('Location', `http://localhost:3000/view/login?jti=${details.jti}`);
      res.setHeader('Content-Length', '0');
      res.end();
      break;
    case 'consent':
      res.statusCode = 303; // eslint-disable-line no-param-reassign
      res.setHeader('Location', `http://localhost:3000/view/interation?jti=${details.jti}`);
      res.setHeader('Content-Length', '0');
      res.end();
      break;
  }  
});

app.post('/interaction/:uid/confirm', async (req, res, next) => {
  const details = await oidc.interactionDetails(req, res);
  details = null;
});

app.post('/interaction/:uid/login', async (req, res) => {
  const result = {
    // authentication/login prompt got resolved, omit if no authentication happened, i.e. the user
    // cancelled
    login: {
      accountId: '7ff1d19a-d3fd-4863-978e-8cce75fa880c', // logged-in account id
      acr: 'string', // acr value for the authentication
      remember: true, // true if provider should use a persistent cookie rather than a session one, defaults to true
      ts: now(), // unix timestamp of the authentication, defaults to now()
    },
  
    // consent was given by the user to the client for this session
    consent: {
      grantId: 'string', // the identifer of Grant object you saved during the interaction, resolved by Grant.prototype.save()
    },
  
    ['custom prompt name resolved']: {},
  }
  const finishedResult = await oidc.interactionFinished(req, res, result); // result object below
  return finishedResult;
});

app.listen(3000, function () {
  console.log('OIDC is listening on port 3000!');
});