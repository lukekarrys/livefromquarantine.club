const path = require('path')
const fs = require('fs').promises
const prettier = require('prettier')
const { fullArtists } = require('./api/artists')

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

  const newReadme = readme.replace(
    readmePlaylists.trim(),
    fullArtists
      .map(
        (a) =>
          `- ${a.meta.title} - [LFQ](https://livefromquarantine.club/${a.id}) [YouTube](https://www.youtube.com/playlist?list=${a.playlistId})`
      )
      .join('\n')
  )

  fs.writeFile(
    readmePath(),
    prettier.format(newReadme, {
      parser: 'markdown',
    })
  )
}

main()
  .then(() => console.log('Readme built'))
  .catch((e) => console.error(e))
