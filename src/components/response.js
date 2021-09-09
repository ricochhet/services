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

module.exports = createResponse
