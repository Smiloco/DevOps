"use strict";
const axios = require('axios');
const querystring = require ('querystring');
const jwkToPem = require("jwk-to-pem");
const jwt = require("jsonwebtoken");

let pems;
const axiosRequestConfig = {headers: {'content-type': 'application/x-www-form-urlencoded'}};
const callbackUrl = 'http://localhost:8000/callback.html';
const cognitoAuthUrl = 'https://devops-up.auth.eu-central-1.amazoncognito.com/'; 
const cognitoClientId = '76am19mg5mfq0f2c4b08pkd4p6';
const cognitoUserPoolId = 'eu-central-1_Ba7HUJHI5';


class CognitoExpress {
    userPoolId;
    tokenUse;
    tokenExpiration;
    iss;
    promise;
    
    constructor(config) {
        if (!config)
            throw new TypeError(
                "Options not found. Please refer to README for usage example at https://github.com/ghdna/cognito-express"
            );

        if (configurationIsCorrect(config)) {
            this.userPoolId = config.cognitoUserPoolId;
            this.tokenUse = config.tokenUse;
            this.tokenExpiration = config.tokenExpiration || 3600000;
            this.iss = `https://cognito-idp.${config.region}.amazonaws.com/${this
                .userPoolId}`;
        }
    }

    async init() {
        if (!pems) {
            const response = await axios.get(`${this.iss}/.well-known/jwks.json`);

            pems = {};
            let keys = response.data.keys;
            for (let i = 0; i < keys.length; i++) {
                let key_id = keys[i].kid;
                let modulus = keys[i].n;
                let exponent = keys[i].e;
                let key_type = keys[i].kty;
                let jwk = { kty: key_type, n: modulus, e: exponent };
                let pem = jwkToPem(jwk);
                pems[key_id] = pem;
            }
        }
    }

    async validate(token) {
        await this.init();
        let decodedJwt = jwt.decode(token, { complete: true });
        if (!decodedJwt) throw new TypeError('Not a valid JWT token');

        if (decodedJwt.payload.iss !== this.iss)
            throw new TypeError('token is not from your User Pool');

        if (decodedJwt.payload.token_use !== this.tokenUse)
            throw new TypeError(`Not an ${this.tokenUse} token`);

        let kid = decodedJwt.header.kid;
        let pem = pems[kid];

        if (!pem) throw new TypeError(`Invalid ${this.tokenUse} token`);

        let params = {
            token: token,
            pem: pem,
            iss: this.iss,
            maxAge: this.tokenExpiration
        };
        return jwtVerify(params);
    
    }
}

function configurationIsCorrect(config) {
    let configurationPassed = false;
    switch (true) {
        case !config.region:
            throw new TypeError("AWS Region not specified in constructor");
            break;
        case !config.cognitoUserPoolId:
            throw new TypeError(
                "Cognito User Pool ID is not specified in constructor"
            );
            break;
        case !config.tokenUse:
            throw new TypeError(
                "Token use not specified in constructor. Possible values 'access' | 'id'"
            );
            break;
        case !(config.tokenUse == "access" || config.tokenUse == "id"):
            throw new TypeError(
                "Token use values not accurate in the constructor. Possible values 'access' | 'id'"
            );
            break;
        default:
            configurationPassed = true;
    }
    return configurationPassed;
}

function jwtVerify(params) {
    return jwt.verify(
        params.token,
        params.pem,
        {
            issuer: params.iss,
            maxAge: params.maxAge
        }
    );
}

const cognitoExpress = new CognitoExpress({
  region: "eu-central-1",
  cognitoUserPoolId,
  tokenUse: 'id', //Possible Values: access | id
  tokenExpiration: 3600 * 1000 //Up to default expiration of 1 hour (3600000 ms)
});

async function refreshTokens(refresh_token) {
  const url = cognitoAuthUrl + `/oauth2/token`;
  const data = {
      client_id: cognitoClientId,
      refresh_token: refresh_token,
      grant_type: 'refresh_token',
      client_secret: cognitoClientSecret,
  };

  // this might fail for different reasons: https://docs.aws.amazon.com/cognito/latest/developerguide/token-endpoint.html
  const response = await axios.post(url, querystring.stringify(data), axiosRequestConfig );
  return response.data;
}

async function validateToken(token) {
  return await cognitoExpress.validate(token);
}

module.exports = {refreshTokens, validateToken};

