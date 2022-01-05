const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const passport = require('passport');
const http    = require("http");
const fetch = "node-fetch";
const base64url = require('./helper/base64url');
const { createHash, randomBytes } = require('crypto');
const verifier = base64url.encode(randomBytes(32));
const asdf = base64url.encode(createHash('sha256').update(verifier).digest())

const { Issuer,Strategy } = require('openid-client');

const path = require("path");


const app = express();

app.use(cookieParser());
app.use(express.urlencoded({
  extended: true,
}));


app.use(express.json({ limit: '15mb' }));
app.use(session({secret: 'secret', 
                 resave: false, 
                 saveUninitialized: true,}));
app.use(helmet());
/*
const response = await fetch('http://localhost:3000/oidc/.well-known/openid-configuration', 
    {headers: {
         Accept: 'application/json',
     }});
console.log(await response.text());


app.get('/login',
(function (req, res, next) {

    const verifier = base64url.encode(randomBytes(32));
    const code_challenge = base64url.encode(createHash('sha256').update(verifier).digest())
    const code_challenge_method = 'S256';

    const url = `http://localhost:3000/oidc/auth?client_id=oidcCLIENT&scope=openid&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Flogin%2Fcallback&state=fN96K7tkZP0LYh2A5mk6v3uvdqcm9gK74dMwE_zK2JM&code_challenge=5z09na5_TY_30-4Xh5dWm0CyVuTwUX-WSa6OKbJgq6U&code_challenge_method=S256`
    res.statusCode = 302;
    res.setHeader('Location', url);
    res.setHeader('Content-Length', '0');
    res.end();
});

app.use((req, res, next) => {
    params.code_challenge = codeChallenge(verifier);
    params.code_challenge_method = 'S256';
})

app.get('/login/callback',(req,res,next) =>{

  passport.authenticate('oidc',{ successRedirect: '/user',
  failureRedirect: '/' })(req, res, next)
}
  
)

app.get("/",(req,res) =>{
   res.send(" <a href='/login'>Log In with OAuth 2.0 Provider </a>")
})
app.get ("/user",(req,res) =>{
    res.header("Content-Type",'application/json');
    res.end(JSON.stringify({tokenset:req.session.tokenSet,userinfo:req.session.userinfo},null,2));
})

  const httpServer = http.createServer(app)
  
  httpServer.listen(8081,() =>{
      console.log(`Custom Server Running on port 8081`)
    })

    */