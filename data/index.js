const fs = require('fs').promises
const https = require('https')

const channels = {
  dcfc:
    'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=PLVuKHi9v2Rn6WytY_26KfgO2F2yp4Gqgv',
  ajj:
    'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=PLRSI_QNxGZ2lZP141po9tLGpLqM6ciuP1',
}

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

  const channelEntries = Object.entries(channels)
  const resps = await Promise.all(
    channelEntries.map(([, value]) =>
      getJson(`${value}&key=${envVars.API_KEY}`)
    )
  )

  return channelEntries.reduce((acc, [key], index) => {
    acc[key] = resps[index]
    return acc
  }, {})
}

main()
  .then((r) => console.log(JSON.stringify(r, null, 2)))
  .catch(console.error)
