require('dotenv').config()
const axios = require('axios')

const main = async (artist) => {
  if (!artist) throw new Error('Must have an artist')
  return axios.post(
    'https://api.github.com/repos/lukekarrys/livefromquarantine.club/dispatches',
    {
      event_type: 'fetch_data',
      client_payload: { artist, type: 'manual' },
    },
    {
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
      },
    }
  )
}

main(
  ...process.argv
    .slice(2)
    .flatMap((v) => v.split(','))
    .join(',')
)
  .then((res) => {
    console.log('Success')
    console.log(res)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
