type Artist = {
  name: string
  audio?: boolean
}

type ArtistWithId = Artist & {
  id: string
}

export const artistsById: Record<string, Artist> = {
  seanbonnette: { name: 'Sean Bonnette', audio: true },
  bengibbard: { name: 'Ben Gibbard', audio: true },
  benfolds: { name: 'Ben Folds' },
  tmoe: { name: 'The Tallest Man on Earth' },
  hoodinternet: { name: 'The Hood Internet (Experimental Beta)' },
}

export const artists: ArtistWithId[] = Object.keys(artistsById).map((id) => {
  return { id, ...artistsById[id] }
})
