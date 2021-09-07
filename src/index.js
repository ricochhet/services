const fs = require('fs')
const service = require('./service')
const app = service.service(require('http'))

service.cmd(process.argv.slice(2), 'createCredentials', (args) => {
    if (args.length) {
        const name = service.SHA256(args[0])
        const pass = service.SHA256(args[1])
        console.log(name, pass)
    }

    return
})

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
