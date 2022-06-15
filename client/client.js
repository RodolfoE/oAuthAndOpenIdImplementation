const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const passport = require('passport');
const http = require("http");
const { Issuer,Strategy } = require('openid-client');
const path = require("path");
const app = express();
const request = require('request');


app.use(cookieParser());
app.use(express.urlencoded({
  extended: true,
}));

app.use(express.json({ limit: '15mb' }));
app.use(session({secret: 'secret', 
                 resave: false, 
                 saveUninitialized: true,}));
app.use(helmet());
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(function(user, done) {
    console.log('-----------------------------');
    console.log('serialize user');
    console.log(user);
    console.log('-----------------------------');
    done(null, user);
});
passport.deserializeUser(function(user, done) {
    console.log('-----------------------------');
    console.log('deserialize user');
    console.log(user);
    console.log('-----------------------------');
    done(null, user);
});

let endPointToBeReached = process.env.CUSTOMER_PORTAL;

if (!process.env.CUSTOMER_PORTAL){
  endPointToBeReached = 'http://localhost:8080/security/api/auth/oidc';
  //endPointToBeReached = 'http://localhost:3001/api/auth/oidc';
  //endPointToBeReached = 'http://localhost:3000/oidc';
  //endPointToBeReached = 'https://dev.portal.my.sms-group.com/security/api/auth/oidc'
}
//, 'https://cp-test.prd.sms-digital.cloud/login/callback'
Issuer.discover(endPointToBeReached) 
  .then(function (oidcIssuer) {
    var client = new oidcIssuer.Client({
      client_id: "oidcCLIENT",      
      client_secret: "MySecret",      
      grant_types: ["authorization_code"],
      redirect_uri: ['http://localhost:8083/login/callback'],
      response_types: ["code"]
   });

    passport.use(
      'oidc',
      new Strategy({ client, usePKCE: false, passReqToCallback: true}, (req, tokenSet, userinfo, done) => {
        console.log("tokenSet",tokenSet);
        console.log("userinfo",userinfo);
        req.session.tokenSet = tokenSet;
        req.session.userinfo = userinfo;
        return done(null, tokenSet.claims());
      })
    );
  });



app.get('/login',
function (req, res, next) {
    console.log('-----------------------------');
    console.log('/Start login handler');
    next();
},
passport.authenticate('oidc',{scope:"openid"}));

app.get('/login/callback',(req,res,next) =>{
  console.log("blabla");
  passport.authenticate('oidc',{ successRedirect: '/user',
  failureRedirect: '/' })(req, res, next)
}
  
)

app.get("/",(req,res) =>{
   res.send(" <a href='/login'>Log In with OAuth 2.0 Provider </a>")
})
app.get ("/user", (req, res, next) =>
{ 
  console.log("/user reached");
  if (!req.session.tokenSet) res.redirect('/');
  else
  next();
}, 
(req,res) =>{
    res.header("Content-Type",'application/json');
    res.end(JSON.stringify({tokenset:req.session.tokenSet,userinfo:req.session.userinfo},null,2));

})

app.get("/send_register", (req, res) => {
  const endpoint = 'http://localhost:8080/security/api/auth/oidc/reg';
    var options = {
      url: endpoint,
      json: true,
      method: 'POST',
      body: {
          grant_types: ["authorization_code", "refresh_token"],      
          redirect_uris: [ 'http://localhost:8083/login/callback'],
          response_types: ["code"],
          access_token: "jhosoyuntokendeacessoinicial"
      },
      headers: {
        //ContentType: 'application/x-www-form-urlencoded'
        authorization: 'Bearer jhosoyuntokendeacessoinicial'
      }
    };
    request.post(options, (err, res, body) => {
      if (err) {
          return console.log(err);
      }
      console.log(`Status: ${res.statusCode}`);
      console.log(body);
  });
  res.send("Blablabla");
});

  const httpServer = http.createServer(app)
  //const server= https.createServer(options,app).listen(3003);
  httpServer.listen(8083,() =>{
      console.log(`Http Server Running on port 8083`)
    })