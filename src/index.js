const fs = require('fs')
const service = require('./service')
const app = service.service(require('http'))

app.post('/auth', (req, res) => {
    service.basicAuth(
        req,
        res,
        service.basicAuthHandler,
        () => {
            res.send('Success!', 401)
        },
        JSON.parse(fs.readFileSync('./src/table.json').toString())
    )
})

app.listen(8080).message('Listening on port: 8080')
