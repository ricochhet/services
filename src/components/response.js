const createResponse = (res) => {
    res.out = (message, statusCode) => {
        return {
            _write: () => {
                res.end(message)
            },
            _send: () => {
                res.statusCode = statusCode
                res.end(message)
            },
            send: (url, outlog = false) => {
                res.statusCode = statusCode

                if (outlog) {
                    res.end(`${url}: ${message} - ${statusCode}`)
                } else {
                    res.end(message)
                }

                console.log(`${url}: ${message} - ${statusCode}`)
            },
        }
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

module.exports = createResponse
