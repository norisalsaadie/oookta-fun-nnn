const bodyParser = require('body-parser')
const compression = require('compression')
const session = require('express-session')
const express = require('express')
const path = require('path')
const config = require('./config')

const PORT = config.port

express()
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: false }))
  .use(compression())
  .use(session({
    secret: 'AlwaysOn',
    cookie: { maxAge: 3600000 },
    resave: false,
    saveUninitialized: false,
  }))
  .set('view engine', 'html')
  .set('views', path.resolve(__dirname, 'views'))
  .get('/', (req, res) => res.sendFile(path.resolve(__dirname, 'views', 'index.html')))
  .listen(PORT, () => {
    console.log(`server up and listening on ${PORT}`)
  })

  // this.authClient = new OktaAuth({
  //   url: this.config.oktaUrl,
  //   clientId: this.config.clientId,
  //   redirectUri: this.config.redirectUri,
  //   scopes: ['openid', 'email', 'profile'],
  // });
