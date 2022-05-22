const chats = [];
const DateTime = require('luxon').DateTime;

function send(req, res) {
    const {author, message } = req.body;
    console.log('received message', author, message)
    
    const now = DateTime.local();
    chats.push({
        date: now.toISO(),
        author,
        message
    });
    return res.json('ok');
}

function receive(req, res) {
    return res.json(chats);
}

module.exports =  {
    send,
    receive
}