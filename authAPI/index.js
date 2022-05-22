const express = require('express')
const axios = require('axios');
const app = express()
const port = 3000;

const callbackUrl = 'http://localhost:8000/callback.html';
const cognitoAuthUrl = 'https://devops-up.auth.eu-central-1.amazoncognito.com/'; 
const cognitoClientId = '76am19mg5mfq0f2c4b08pkd4p6';
const cognitoClientSecret = '1d7vrsn8la2s1rh0sln6sgpb5qkio6pcjp060ujsfi8i2jkueq1g';
const axiosRequestConfig = {headers: {'content-type': 'application/x-www-form-urlencoded'}};

const cookieOptions = {path: '/', httpOnly: true, sameSite: 'strict', secure: false};

app.use(express.json());

app.use((req, res, next) => {
  console.log(req.method + ' ' + req.url);
  next();
})

app.get('', (req, res) => {
  res.send('Auth API')
})

app.post('/auth/exchange-code-for-token', async (req, res) => {
  
  const {code} = req.body;

  try {
    const tokens = await exchange(code);
    
    return res
      .cookie('id_token', tokens.id_token, cookieOptions)
      .cookie('refresh_token', tokens.refresh_token, cookieOptions)
      .json('ok');

  } catch (err) {
    console.error(err)
    return res.status(500).json(err);
  }
});

async function exchange(code) {
  const url = cognitoAuthUrl + `/oauth2/token`;
  const data = {
    client_id: cognitoClientId,
    code,
    redirect_uri: callbackUrl,
    grant_type: 'authorization_code',
    client_secret: cognitoClientSecret,
  };
  
  const response = await axios.post(url, new URLSearchParams(data).toString(), axiosRequestConfig);
  return response.data;
}

app.get('/auth/login-url', (req, res) => {
   
  const url = `${cognitoAuthUrl}/login?client_id=${cognitoClientId}&redirect_uri=${callbackUrl}&scope=email+openid+phone&response_type=code`;
  return res.json(url);
})

app.listen(port, () => {
  console.log(`Auth app listening on port ${port}`)
})