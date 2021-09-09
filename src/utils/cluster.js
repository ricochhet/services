const clust = require('cluster')
const { cpus } = require('os')

const cluster = (handler, callback) => {
    const numCPUs = cpus().length

    if (clust.isPrimary) {
        console.log(`Primary ${process.pid} is running`)

        for (let i = 0; i < numCPUs; i++) {
            clust.fork()
        }

        clust.on('exit', (worker, code, signal) => {
            if (signal) {
                console.log(
                    `Worker ${worker.process.pid} was killed by signal: ${signal}`
                )
            } else if (code !== 0) {
                console.log(
                    `Worker ${worker.process.pid} exited with error code: ${code}`
                )
            } else {
                console.log(`Worker ${worker.process.pid} success`)
            }
        })

        callback(process.pid, process)
    } else {
        handler(process.pid, process)
        console.log(`Worker ${process.pid} started`)
    }
}

module.exports = cluster
