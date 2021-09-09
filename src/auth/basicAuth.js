const timeSafeCompare = require('../utils/compare')
const SHA256 = require('../crypto/sha256')

const CREDENTIALS_REGEXP = new RegExp(
    '^ *(?:[Bb][Aa][Ss][Ii][Cc]) +([A-Za-z0-9._~+/-]+=*) *$'
)
const USER_PASS_REGEXP = new RegExp('^([^:]*):(.*)$')

const create = (
    req,
    res,
    handler,
    middleware,
    basicAuthHandlerTable = null
) => {
    if (!req.headers || typeof req.headers !== 'object') return
    const headers = req.headers.authorization
    const decodeBase64 = (str) => {
        return Buffer.from(str, 'base64').toString()
    }

    const credentials = CREDENTIALS_REGEXP.exec(headers)
    if (!credentials) return null

    const userPass = USER_PASS_REGEXP.exec(decodeBase64(credentials[1]))
    if (!userPass) return null

    if (typeof middleware !== 'function') return null
    if (
        !userPass ||
        !handler(userPass[1], userPass[2], basicAuthHandlerTable)
    ) {
        res.statusCode = 401
        res.setHeader('WWW-Authenticate', 'Basic realm="realm"')
        res.end('Unauthorized')
    } else {
        middleware()
    }
}

const handler = (user, pass, basicAuthHandlerTable) => {
    if (basicAuthHandlerTable) {
        user = SHA256(user)
        pass = SHA256(pass)

        for (const i in basicAuthHandlerTable) {
            const compareUser = timeSafeCompare(
                user,
                basicAuthHandlerTable[i]['user']
            )

            const comparePass = timeSafeCompare(
                pass,
                basicAuthHandlerTable[i]['pass']
            )

            if (compareUser && comparePass) {
                return true
            }
        }

        return false
    } else {
        return null
    }
}

module.exports = {
    create,
    handler,
}
