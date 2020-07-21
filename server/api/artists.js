const fs = require('fs')
const path = require('path')

const artists = fs
  .readdirSync(path.join(__dirname, '..', 'functions', 'videos'))
  .filter((f) => path.extname(f) === '.json')
  .map((f) => path.basename(f, '.json'))

module.exports = {
  artists,
  cli: () => {
    const cli = process.argv.slice(2).flatMap((v) => v.split(','))
    return cli.length ? cli : artists
  },
}
