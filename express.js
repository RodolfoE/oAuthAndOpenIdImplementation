const express = require('express');
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

app.listen(3000, function () {
  console.log('OIDC is listening on port 3000!');
});