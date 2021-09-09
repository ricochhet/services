const parseUrl = require('./parsers/url')
const parseQuery = require('./parsers/query')

const readBody = require('./components/body')
const createResponse = require('./components/response')
const processMiddleware = require('./components/middleware')

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

module.exports = service
