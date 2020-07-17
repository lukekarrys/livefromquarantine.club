const { parseData } = require('./parse')

// This is in its own file because netlify cant package a function with arbitrary
// require expressions in it
const buildArtistFromId = (artistId) => {
  let artist = null
  let artistData = null

  try {
    artist = require(`./${artistId}`)
    artistData = require(`../data/${artistId}.json`)
  } catch (e) {
    throw new Error(`Invalid artistId: ${artistId}`)
  }

  if (!artistData || !artist) {
    throw new Error(`Invalid artistId: ${artistId}`)
  }

  return {
    meta: artist.meta,
    data: parseData(artistData.videos, artist.parsers),
  }
}

module.exports = buildArtistFromId
