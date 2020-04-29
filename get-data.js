const fs = require("fs").promises
const https = require("https")

const getJson = (url) =>
  new Promise((resolve, reject) => {
    https.get(url, (res) => {
      res.setEncoding("utf8")
      let rawData = ""
      res.on("data", (chunk) => {
        rawData += chunk
      })
      res.on("end", () => {
        try {
          resolve(JSON.parse(rawData))
        } catch (e) {
          reject(e)
        }
      })
    })
  })

const getEnvVars = async () =>
  (await fs.readFile(".env"))
    .toString()
    .split("\n")
    .map((l) => l.split("="))
    .reduce((acc, item) => {
      acc[item[0]] = item[1]
      return acc
    }, {})

const main = async () => {
  const envVars = await getEnvVars()
  const resp = await getJson(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${envVars.PLAYLIST_ID}&key=${envVars.API_KEY}`
  )
  return resp
}

main()
  .then((r) => console.log(JSON.stringify(r, null, 2)))
  .catch(console.error)

