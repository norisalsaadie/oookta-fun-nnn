const bodyParser = require('body-parser')
const compression = require('compression')
const express = require('express')
const path = require('path')
const config = require('./config')

const PORT = config.port

express()
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: false }))
  .use(compression())
  .set('view engine', 'html')
  .set('views', path.resolve(__dirname, 'views'))
  .get('/', (req, res) => res.sendFile(path.resolve(__dirname, 'views', 'index.html')))
  .listen(PORT, () => {
    console.log(`server up and listening on ${PORT}`)
  })
