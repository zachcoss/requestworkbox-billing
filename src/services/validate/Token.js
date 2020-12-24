const 
    listTokens = require('./TokenListTokens'),
    generateToken = require('./TokenGenerateToken'),
    revokeToken = require('./TokenRevokeToken');

module.exports = {
    listTokens: listTokens,
    generateToken: generateToken,
    revokeToken: revokeToken,
}