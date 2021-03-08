import path from 'path'
import { promises as fs } from 'fs'
import prettier from 'prettier'
import { getFullArtists } from './api/artists'

const readmePath = () => path.join(__dirname, '..', 'README.md')

const main = async () => {
  const readme = await fs.readFile(readmePath(), 'utf-8')

  const readmePlaylists = readme
    .split('\n')
    .filter((l) => l.includes('https://www.youtube.com/playlist?list='))
    .join('\n')

  if (!readmePlaylists) {
    throw new Error('Could not find playlist section of readme')
  }

  const fullArtists = await getFullArtists()

  const newReadme = readme.replace(
    readmePlaylists.trim(),
    fullArtists
      .map((artist) => {
        const lfqLink = `[LFQ](https://livefromquarantine.club/${artist.id})`
        const ytLink = `[YouTube](https://www.youtube.com/playlist?list=${artist.playlistId})`
        return `- ${artist.meta.title} - ${lfqLink} ${ytLink}`
      })
      .join('\n')
  )

  await fs.writeFile(
    readmePath(),
    prettier.format(newReadme, {
      parser: 'markdown',
    })
  )
}

main()
  .then(() => console.log('Readme built'))
  .catch((e) => console.error(e))
