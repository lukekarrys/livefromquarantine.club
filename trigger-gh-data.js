require('dotenv').config()

const axios = require('axios')

axios.post(
  'https://api.github.com/repos/lukekarrys/livefromquarantine.club/dispatches',
  {
    event_type: 'fetch_data',
    client_payload: { artist: 'seanbonnette,bengibbard' },
  },
  {
    headers: {
      Authorization: `token ${process.env.GITHUB_TOKEN}`,
    },
  }
)
