const fs = require('fs').promises
const https = require('https')
const channels = const parsers = [require('../build/ajj'), require('../build/dcfc')]

const getJson = (url) =>
  new Promise((resolve, reject) => {
    https.get(url, (res) => {
      res.setEncoding('utf8')
      let rawData = ''
      res.on('data', (chunk) => {
        rawData += chunk
      })
      res.on('end', () => {
        try {
          resolve(JSON.parse(rawData))
        } catch (e) {
          reject(e)
        }
      })
    })
  })

const getEnvVars = async () =>
  (await fs.readFile('.env'))
    .toString()
    .split('\n')
    .map((l) => l.split('='))
    .reduce((acc, item) => {
      acc[item[0]] = item[1]
      return acc
    }, {})

const main = async () => {
  const envVars = await getEnvVars()

  const resps = await Promise.all(
    channels.map((c) =>
      getJson(`${c.meta.api}&key=${envVars.API_KEY}`)
    )
  )

  return channels.reduce((acc, c, index) => {
    acc[c.id] = resps[index]
    return acc
  }, {})
}

main()
  .then((r) => console.log(JSON.stringify(r, null, 2)))
  .catch(console.error)
