type Artist = {
  name: string
  audio?: boolean
}

type ArtistWithId = Artist & {
  id: string
}

export const artistsById: { [key: string]: Artist | undefined } = {
  seanbonnette: { name: 'Sean Bonnette', audio: true },
  bengibbard: { name: 'Ben Gibbard', audio: true },
  benfolds: { name: 'Ben Folds' },
  tmoe: { name: 'The Tallest Man on Earth' },
  hoodinternet: { name: 'The Hood Internet (Experimental Beta)' },
}

export const artists: ArtistWithId[] = Object.keys(artistsById).map((id) => {
  const artist = artistsById[id] as Artist
  return { id, ...artist }
})
