const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') })

const axios = require('axios')

const main = async (...artists) => {
  return axios.post(
    'https://api.github.com/repos/lukekarrys/livefromquarantine.club/dispatches',
    {
      event_type: 'fetch_data',
      client_payload: { artist: artists.join(','), type: 'manual' },
    },
    {
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
      },
    }
  )
}

main(...process.argv.slice(2).flatMap((v) => v.split(',')))
  .then((res) => {
    console.log('Success')
    console.log(res.status)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
