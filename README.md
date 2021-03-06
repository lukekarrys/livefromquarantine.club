# livefromquarantine.club

## Preloaded Playlist Links

- Ben Folds – Apartment Requests - [LFQ](https://livefromquarantine.club/benfolds) [YouTube](https://www.youtube.com/playlist?list=PLG507gy2-Kp8Vj66jnxn1AA0XFr1L_QXy)
- Ben Gibbard – Live From Home - [LFQ](https://livefromquarantine.club/bengibbard) [YouTube](https://www.youtube.com/playlist?list=PLVuKHi9v2Rn6WytY_26KfgO2F2yp4Gqgv)
- The Hood Internet - [LFQ](https://livefromquarantine.club/hoodinternet) [YouTube](https://www.youtube.com/playlist?list=PLqrkwSi3LHneR8zHLgCnuFLCE76Qwm2iE)
- Sean Bonnette – Live From Quarantine - [LFQ](https://livefromquarantine.club/seanbonnette) [YouTube](https://www.youtube.com/playlist?list=PLRSI_QNxGZ2lZP141po9tLGpLqM6ciuP1)
- The Tallest Man on Earth – #StayHome #WithMe - [LFQ](https://livefromquarantine.club/tmoe) [YouTube](https://www.youtube.com/playlist?list=PLsqIAvvqdduhw1f7RVxdcCmaCm5Zy7Osc)

## Links

- [Google API Dashboard](https://console.developers.google.com/apis/credentials?project=livefromquarantine)

## Preloaded Playlists

Preloaded playlists are fetched and saved to this repo. This can also be triggered via a `respository_dispatch` action. A quick script to do this is run via `npm run trigger`. They are also pushed to the database on each push to the main branch. The data is stored in the repo to make deploys faster and less likely to fall since the YouTube API has some transient errors sometimes.

## Adding a Preloaded Playlist

1. Add a file to `server/functions/videos/ARTIST_ID.js` with the values from [the `types` files](./server/types/index.ts)
1. Create an empty file at `server/data/ARTIST_ID.json`
1. Add an entry to `client/artists.json` with a matching `id` and the `name` which will populate the button on the index page
1. Run `npm run data ID` to save the data to `server/data/ARTIST_ID.json`
1. Run `npm run data:fixtures ID` to see a visually easier to parse representation of what is parsed from that artist's data

## Building the site

This will build a production version of the site. Any data previously preloaded via `npm run data` will be parsed into the correct API format and moved to the build directory.

```sh
NODE_ENV=production npm run build
```

## Dev

This will spin up a dev server for the API and run the client locally. The dev server will use the preloaded data for the available playlists and load the rest directly from YouTube. The responses from YouTube will be cached while the dev server is running to cut down on YouTube API requests.

```sh
npm run dev
```
