const fs = require('fs')
const service = require('./service')
const cluster = require('./utils/cluster')
const basicAuth = require('./auth/basicAuth')

cluster(
    () => {
        const app = service(require('http'))

        app.post('/auth', (req, res) => {
            basicAuth.create(
                req,
                res,
                basicAuth.handler,
                () => {
                    res.out('Success!', 200).send(req.url)
                },
                JSON.parse(fs.readFileSync('./userHashTable.json').toString())
            )
        })

        app.listen(8080)
    },
    () => {
        console.log('Listening on port: 8080')
    }
)
