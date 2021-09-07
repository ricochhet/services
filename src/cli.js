const service = require('./service')

service.cmd(process.argv.slice(2), 'createCredentials', (args) => {
    if (args.length) {
        const name = service.SHA256(args[0])
        const pass = service.SHA256(args[1])
        console.log(name, pass)
    }

    return
})