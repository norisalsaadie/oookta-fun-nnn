const bodyParser = require('body-parser')
const compression = require('compression')
const express = require('express')
const path = require('path')
const jws = require('jws')
const config = require('./config')

const PORT = config.port

express()
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: false }))
  .use(compression())
  .set('view engine', 'html')
  .set('views', path.resolve(__dirname, 'views'))
  .get('/', (req, res) => res.sendFile(path.resolve(__dirname, 'views', 'index.html')))
  .get('/authenticated-yo', (req, res, next) => {
    const auth = req.get('authorization').split(' ')[1]
    if (!auth) {
      return res.status(401).send('oh snap, you have no token. Please go home.')
    }
    const decoded = jws.decode(auth)

    console.log(decoded);

    if (!decoded) {
      return res.status(401).send('id_token could not be decoded from the response')
    }

  })
  .listen(PORT, () => {
    console.log(`server up and listening on ${PORT}`)
  })
