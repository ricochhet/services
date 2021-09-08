const fs = require('fs')
const service = require('./service')

service.cluster(
    () => {
        const app = service.service(require('http'))

        app.post('/auth', (req, res) => {
            service.basicAuth(
                req,
                res,
                service.basicAuthHandler,
                () => {
                    res.send('Success!', 200)
                    console.log(`/auth: success - 200`)
                },
                JSON.parse(fs.readFileSync('./userHashTable.json').toString())
            )
        })

        app.listen(8080) /*.message('Listening on port: 8080')*/
    },
    () => {
        console.log('Listening on port: 8080')
    }
)
