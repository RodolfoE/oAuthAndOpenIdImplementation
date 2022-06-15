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

const { strict: assert } = require('assert');

const configuration = require('./support/configuration');

configuration.findAccount = async function(ctx, id, token) {
    return {
      accountId: 'rodolfo',
      async claims(use, scope, claims, rejected) {
        return {
          sub: 'rodolfo',
          profile: ['asdf', 'DASHBOARD:READ']
        };
      },
  }
}

app.use((req, res, next) => {
  console.log(req.url);
  
  next();
});

const provider = new Provider('http://localhost:3000',  { adapter, ...configuration} );

app.use("/oidc", provider.callback());

const { constructor: { errors: { SessionNotFound } } } = provider;


function setNoCache(req, res, next) {
  res.set('Pragma', 'no-cache');
  res.set('Cache-Control', 'no-cache, no-store');
  next();
}

app.get('/interaction/:uid', setNoCache, async (req, res, next) => {
  try {
    const {
      uid, prompt, params, session,
    } = await provider.interactionDetails(req, res);

    switch (prompt.name) {
      case 'login': {
        return doLogin(req, res, next);
      }
      case 'consent': {
        return doConsent(req, res, next);
      }
      default:
        return undefined;
    }
  } catch (err) {
    return next(err);
  }
});

const doLogin = async (req, res, next) => {
  try {
    const { prompt: { name } } = await provider.interactionDetails(req, res);
    assert.equal(name, 'login');
    
    //const account = await Account.findByLogin(req.body.login);

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

    await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
  } catch (err) {
    next(err);
  }
};

const doConsent = async (req, res, next) => {
  try {
    const interactionDetails = await provider.interactionDetails(req, res);
    const { prompt: { name, details }, params, session: { accountId } } = interactionDetails;
    assert.equal(name, 'consent');

    let { grantId } = interactionDetails;
    let grant;

    if (grantId) {
      // we'll be modifying existing grant in existing session
      grant = await provider.Grant.find(grantId);
    } else {
      // we're establishing a new grant
      grant = new provider.Grant({
        accountId,
        clientId: params.client_id,
      });
    }

    if (details.missingOIDCScope) {
      grant.addOIDCScope(details.missingOIDCScope.join(' '));
    }
    if (details.missingOIDCClaims) {
      grant.addOIDCClaims(details.missingOIDCClaims);
    }
    if (details.missingResourceScopes) {
      // eslint-disable-next-line no-restricted-syntax
      for (const [indicator, scopes] of Object.entries(details.missingResourceScopes)) {
        grant.addResourceScope(indicator, scopes.join(' '));
      }
    }

    grantId = await grant.save();

    const consent = {};
    if (!interactionDetails.grantId) {
      // we don't have to pass grantId to consent, we're just modifying existing one
      consent.grantId = grantId;
    }

    const result = { consent };
    await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: true });
  } catch (err) {
    next(err);
  }
}

app.get('/interaction/:uid/abort', setNoCache, async (req, res, next) => {
  try {
    const result = {
      error: 'access_denied',
      error_description: 'End-User aborted interaction',
    };
    await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  if (err instanceof SessionNotFound) {
    // handle interaction expired / session not found error
  }
  next(err);
});

app.listen(3000, function () {
  console.log('OIDC is listening on port 3000!');
});