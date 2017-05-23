const bodyParser = require('body-parser')
const compression = require('compression')
const express = require('express')
const path = require('path')
const jws = require('jws')
const { jwk2pem } = require('pem-jwk')
const request = require('request')
const config = require('./config')

const PORT = config.port

const cachedJwks = {}

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

    if (!decoded) {
      return res.status(401).send('id_token could not be decoded from the response')
    }

    new Promise((resolve, reject) => {
      // If we've already cached this JWK, return it
      if (cachedJwks[decoded.header.kid]) {
        return resolve(cachedJwks[decoded.header.kid])
      }

      // If it's not in the cache, get the latest JWKS from /oauth2/v1/keys
      const options = {
        url: `${config.oktaUrl}/oauth2/v1/keys`,
        json: true,
      }

      request(options, (err, resp, json) => {
        if (err) {
          return reject(err)
        } else if (json.error) {
          return reject(json)
        }

        json.keys.forEach(key => cachedJwks[key.kid] = key)
        if (!cachedJwks[decoded.header.kid]) {
          return res.status(401).send('No public key for the returned id_token')
        }

        resolve(cachedJwks[decoded.header.kid])
      })
    })
    .then((jwk) => {
      const claims = JSON.parse(decoded.payload)

      console.log('claims', claims)

      // Using the jwk, verify that the id_token signature is valid. In this
      // case, the library we're using, JWS, requires PEM encoding for our JWK.
      const pem = jwk2pem(jwk)
      if (!jws.verify(auth, jwk.alg, pem)) {
        return res.status(401).send('id_token signature is invalid')
      }

      // Verify that the issuer is Okta, and specifically the endpoint that we
      // performed authorization against.
      if (config.oktaUrl !== claims.iss) {
        return res.status(401).send(`id_token issuer ${claims.iss} does not match our issuer ${config.oktaUrl}`)
      }

      // Verify that the id_token was minted specifically for our clientId
      if (config.clientId !== claims.aud) {
        return res.status(401).send(`id_token aud ${claims.aud} does not match our clientId ${config.clientId}`)
      }

      // Verify the token has not expired. It is also important to account for
      // clock skew in the event this server or the Okta authorization server has
      // drifted.
      const now = Math.floor(new Date().getTime() / 1000)
      const maxClockSkew = 300 // 5 minutes
      if (now - maxClockSkew > claims.exp) {
        const date = new Date(claims.exp * 1000)
        return res.status(401).send(`The JWT expired and is no longer valid - claims.exp ${claims.exp}, ${date}`)
      }

      // Verify that the token was not issued in the future (accounting for clock
      // skew).
      if (claims.iat > (now + maxClockSkew)) {
        return res.status(401).send(`The JWT was issued in the future - iat ${claims.iat}`)
      }

      return res.json({ claims })
    })
    .catch(err => res.status(500).send(`Error! ${JSON.stringify(err)}`))
  })
  .listen(PORT, () => {
    console.log(`server up and listening on ${PORT}`)
  })
