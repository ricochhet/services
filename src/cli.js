const args = require('./utils/args')
const SHA256 = require('./crypto/sha256')

args.command(args.hideBin(process.argv), 'createCredentials', (args) => {
    if (args.length) {
        const name = SHA256(args[0])
        const pass = SHA256(args[1])
        console.log(name, pass)
    }
})
