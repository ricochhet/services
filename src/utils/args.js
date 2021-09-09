const hideBin = (args) => {
    return args.slice(2)
}

const command = (args, name, callback) => {
    if (typeof callback !== 'function') {
        return null
    }

    if (args[0] == name) {
        callback(args.slice(1), name)
    }
}

module.exports = {
    hideBin,
    command,
}
