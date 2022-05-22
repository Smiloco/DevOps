const express = require('express')
const app = express()
const port = 3000;
const chat = require('./chat');
const authentication = require('./authentication');
var cookieParser = require('cookie-parser')

app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  console.log(req.method + ' ' + req.url);
  
  next();
})

app.get('/chat', (req, res) => {
  res.send('Chat API')
});

const authenticated = express.Router();
authenticated.use(authentication);
app.use(authenticated);

authenticated.post('/chat/send', chat.send);
authenticated.get('/chat/receive', chat.receive);

app.listen(port, () => {
  console.log(`Chat api listening on port ${port}`)
})