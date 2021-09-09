const crypto = require('crypto')

const SHA256 = (str) => {
    return crypto.createHash('sha256').update(str).digest('hex')
}

module.exports = SHA256
