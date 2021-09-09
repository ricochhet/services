const crypto = require('crypto')

const bufferEqual = (a, b) => {
    if (a.length !== b.length) {
        return false
    }

    if (crypto.timingSafeEqual) {
        return crypto.timingSafeEqual(a, b)
    }

    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false
        }
    }
    return true
}

const timeSafeCompare = (a, b) => {
    const sa = String(a)
    const sb = String(b)
    const key = crypto.pseudoRandomBytes(32)
    const ah = crypto.createHmac('sha256', key).update(sa).digest()
    const bh = crypto.createHmac('sha256', key).update(sb).digest()

    return bufferEqual(ah, bh) && a === b
}

module.exports = timeSafeCompare
