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

configuration.findAccount = async (ctx, id) => {
    return {
    accountId: id,
    claims: async () => ({
      sub: id,
      preferred_username: id,
    }),
  }
}

const oidc = new Provider('http://localhost:3000',  { adapter, ...configuration} );

app.use("/oidc",oidc.callback());

app.get('/view/:viewName', (req, res) => {
  res.render(req.params.viewName, { uid: req.query.jti });
});

app.get('/interaction/:uid', async (req, res, next) => {
  const details = await oidc.interactionDetails(req, res);
  if (details.prompt.name === 'consent'){
    return await conceiveGrant(req, res);
  }
  return await authenticate(req, res);
});

const authenticate = async (req, res) => {
  const result = {
    // authentication/login prompt got resolved, omit if no authentication happened, i.e. the user
    // cancelled
    login: {
      accountId: 'rodolfo', // logged-in account id
      acr: 'string', // acr value for the authentication
      remember: true, // true if provider should use a persistent cookie rather than a session one, defaults to true
      ts: now(), // unix timestamp of the authentication, defaults to now()
    }
  }
  await oidc.interactionFinished(req, res, result);
}

const conceiveGrant = async (req, res) => {
  const {
    prompt: { name, details }, grantId, session, params, missingOIDCScope, missingOIDCClaims, missingResourceScopes
  } = await oidc.interactionDetails(req, res);
  let grant;
  if (grantId) {
    // we'll be modifying existing grant in existing session
    grant = await oidc.Grant.find(grantId);
  } else {
    // we're establishing a new grant
    grant = new oidc.Grant({
      accountId: session.accountId,
      clientId: params.client_id,
    });
  }

  if (missingOIDCScope) {
    grant.addOIDCScope(missingOIDCScope.join(' '));
  }
  if (missingOIDCClaims) {
    grant.addOIDCClaims(missingOIDCClaims);
  }
  if (missingResourceScopes) {
    // eslint-disable-next-line no-restricted-syntax
    for (const [indicator, scope] of Object.entries(missingResourceScopes)) {
      grant.addResourceScope(indicator, scope.join(' '));
    }
  }

  const result = { consent: { grantId: await grant.save() } };
  await oidc.interactionFinished(req, res, result, {mergeWithLastSubmission: true});
}


app.post('/interaction/:uid/login', async (req, res) => {
  const result = {
    // authentication/login prompt got resolved, omit if no authentication happened, i.e. the user
    // cancelled
    login: {
      accountId: '7ff1d19a-d3fd-4863-978e-8cce75fa880c', // logged-in account id
      acr: 'string', // acr value for the authentication
      remember: true, // true if provider should use a persistent cookie rather than a session one, defaults to true
      ts: now(), // unix timestamp of the authentication, defaults to now()
    }
  }
  await oidc.interactionFinished(req, res, result);
  await next();
});

app.listen(3000, function () {
  console.log('OIDC is listening on port 3000!');
});