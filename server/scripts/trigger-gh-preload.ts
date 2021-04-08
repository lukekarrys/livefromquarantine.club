import '../api/dotenv'
import axios from 'axios'
import { cli } from '../api/artists'

const main = async (artists: string[]) => {
  const { GITHUB_TOKEN } = process.env

  if (!GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN is required env var')
  }

  return axios.post(
    'https://api.github.com/repos/lukekarrys/livefromquarantine.club/dispatches',
    {
      event_type: 'fetch_data',
      client_payload: { artist: artists.join(','), type: 'manual' },
    },
    {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
      },
    }
  )
}

main(cli())
  .then((res) => {
    console.log('Success')
    console.log(res.status)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
