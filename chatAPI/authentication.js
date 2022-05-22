const {refreshTokens, validateToken} = require('./cognito');

const cookieOptions = {path: '/', httpOnly: true, sameSite: 'strict', secure: false};

async function authentication(req, res, next) {
    
    const {id_token, refresh_token} = req.cookies
    
    //Fail if token not present in header. 
    if (!id_token) return res.status(401).send("ID Token missing from cookies");
    if (!refresh_token)return res.status(401).json('No refresh token cookie present');
    
    try {
        const claims = await validateToken(id_token);
        res.locals.email = claims.email;
        res.locals.user = claims;
        next()
    } catch (err) {
        console.info('Unable to validate token', err.message);
        try {
            const tokens = await refreshTokens(refresh_token);
            res.cookie('id_token', tokens.id_token, cookieOptions)
            
            const claims = await validateToken(tokens.id_token);
            res.locals.email = claims.email;
            res.locals.user = claims;
            next()
    
        } catch (err) {
            console.info('Unable to refresh token', err.message);
            res.clearCookie('id_token', cookieOptions);
            res.clearCookie('refresh_token', cookieOptions);
            return res.status(401).json('Failed to refresh the token');
        }
    }
    
};

module.exports = authentication;