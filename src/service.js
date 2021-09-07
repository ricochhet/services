const CREDENTIALS_REGEXP = new RegExp(
    '^ *(?:[Bb][Aa][Ss][Ii][Cc]) +([A-Za-z0-9._~+/-]+=*) *$'
)
const USER_PASS_REGEXP = new RegExp('^([^:]*):(.*)$')
const crypto = require('crypto')
const fs = require('fs')

const SHA256 = (str) => {
    return crypto.createHash('sha256').update(str).digest('hex')
}

const cmd = (args, name, callback) => {
    if (typeof callback !== 'function') return null
    if (args[0] == name) {
        callback(args.slice(1), name)
    }
}

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

const parseUrl = (url) => {
    let str = ''

    for (let i = 0; i < url.length; i++) {
        const c = url.charAt(i)

        if (c === ':') {
            let param = ''

            for (let j = i + 1; j < url.length; j++) {
                if (/\w/.test(url.charAt(j))) {
                    param += url.charAt(j)
                } else {
                    break
                }
            }

            str += `(?<${param}>\\w+)`
            i = j - 1
        } else {
            str += c
        }
    }

    return str
}

const parseQuery = (url) => {
    const results = url.match(/\?(?<query>.*)/)

    if (!results) {
        return {}
    }

    const {
        groups: { query },
    } = results

    const pairs = query.match(/(?<param>\w+)=(?<value>\w+)/g)
    const params = pairs.reduce((acc, curr) => {
        const [key, value] = curr.split('=')
        acc[key] = value

        return acc
    }, {})

    return params
}

const readBody = (req) => {
    return new Promise((resolve, reject) => {
        let body = ''

        req.on('data', (chunk) => {
            body += '' + chunk
        })

        req.on('end', () => {
            resolve(body)
        })

        req.on('error', (err) => {
            reject(err)
        })
    })
}

const createResponse = (res) => {
    res._write = (message) => res.end(message)
    res.send = (message, statusCode) => {
        res.statusCode = statusCode
        res.end(message)
    }

    res.json = (message) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(message))
    }

    res.html = (message) => {
        res.setHeader('Content-Type', 'text/html')
        res.end(message)
    }

    return res
}

const processMiddleware = (middleware, req, res) => {
    if (!middleware) {
        return new Promise((resolve) => resolve(true))
    }

    return new Promise((resolve) => {
        middleware(req, res, function () {
            resolve(true)
        })
    })
}

const service = (protocol) => {
    const routeTable = {}

    const server = protocol.createServer(async (req, res) => {
        const routes = Object.keys(routeTable)
        let match = false

        for (let i = 0; i < routes.length; i++) {
            const route = routes[i]
            const parsedRoute = parseUrl(route)

            if (
                new RegExp(parsedRoute).test(req.url) &&
                routeTable[route][req.method.toLowerCase()]
            ) {
                let cb = routeTable[route][req.method.toLowerCase()]
                let middleware =
                    routeTable[route][`${req.method.toLowerCase()}-middleware`]
                const m = req.url.match(new RegExp(parsedRoute))

                req.params = m.groups
                req.query = parseQuery(req.url)
                req.body = await readBody(req)

                const result = await processMiddleware(
                    middleware,
                    req,
                    createResponse(res)
                )

                if (result) {
                    cb(req, res)
                }

                match = true
                break
            }
        }

        if (!match) {
            res.statusCode = 404
            res.end('Not Found')
        }
    })

    function registerPath(path, cb, method, middleware) {
        if (!routeTable[path]) {
            routeTable[path] = {}
        }
        routeTable[path] = {
            ...routeTable[path],
            [method]: cb,
            [method + '-middleware']: middleware,
        }
    }

    return {
        get: (path, ...rest) => {
            if (rest.length === 1) {
                registerPath(path, rest[0], 'get')
            } else {
                registerPath(path, rest[1], 'get', rest[0])
            }
        },
        post: (path, ...rest) => {
            if (rest.length === 1) {
                registerPath(path, rest[0], 'post')
            } else {
                registerPath(path, rest[1], 'post', rest[0])
            }
        },
        put: (path, ...rest) => {
            if (rest.length === 1) {
                registerPath(path, rest[0], 'put')
            } else {
                registerPath(path, rest[1], 'put', rest[0])
            }
        },
        delete: (path, ...rest) => {
            if (rest.length === 1) {
                registerPath(path, rest[0], 'delete')
            } else {
                registerPath(path, rest[1], 'delete', rest[0])
            }
        },
        listen: (port, cb) => {
            server.listen(port, cb)

            return {
                message: (message) => {
                    console.log(message)
                },
            }
        },
    }
}

const basicAuth = (
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

const basicAuthHandler = (a, b, basicAuthHandlerTable) => {
    if (basicAuthHandlerTable) {
        a = SHA256(a)
        b = SHA256(b)

        for (const i in basicAuthHandlerTable) {
            const aa = timeSafeCompare(a, basicAuthHandlerTable[i]['a'])
            const bb = timeSafeCompare(b, basicAuthHandlerTable[i]['b'])

            if (aa && bb) {
                return true
            }
        }

        return false
    } else {
        return null
    }
}

module.exports = {
    cmd,
    SHA256,
    service,
    basicAuth,
    basicAuthHandler,
    cmp: timeSafeCompare,
}
