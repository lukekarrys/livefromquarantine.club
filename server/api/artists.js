const fs = require('fs')
const path = require('path')

const artists = fs
  .readdirSync(path.join(__dirname, '..', 'functions', 'videos'))
  .filter((f) => path.extname(f) === '.json')
  .map((f) => path.basename(f, '.json'))

const getFull = (id) => {
  try {
    return require(`../functions/videos/${id}.js`)
  } catch (e) {
    throw new Error(`Could not find artist ${id}\n${e.stack}`)
  }
}

module.exports = {
  artists,
  fullArtists: artists.map(getFull),
  cli: (full) => {
    const cli = process.argv.slice(2).flatMap((v) => v.split(','))
    const unknownCli = cli.some((artistId) => !artists.includes(artistId))

    if (unknownCli) {
      throw new Error(
        `Unknown artist ids '${cli.join(', ')}' were passed to the CLI`
      )
    }

    return (cli.length ? cli : artists).map((id) => (full ? getFull(id) : id))
  },
}
