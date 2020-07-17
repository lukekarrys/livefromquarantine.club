const fs = require('fs')
const path = require('path')

const artists = fs
  .readdirSync(path.join(__dirname))
  .map((f) => path.basename(f, '.js'))
  .filter((a) => a !== 'index')

module.exports = {
  artists,
  cli: () => {
    const cli = process.argv.slice(2).flatMap((v) => v.split(','))
    return cli.length ? cli : artists
  },
}
