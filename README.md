# livefromquarantine.club

## Playlists

- [Sean Bonnette](https://www.youtube.com/playlist?list=PLRSI_QNxGZ2lZP141po9tLGpLqM6ciuP1)
- [Ben Gibbard](https://www.youtube.com/playlist?list=PLVuKHi9v2Rn6WytY_26KfgO2F2yp4Gqgv)
- [Ben Folds](https://www.youtube.com/playlist?list=PLG507gy2-Kp8Vj66jnxn1AA0XFr1L_QXy)
- [TMOE](https://www.youtube.com/playlist?list=PLsqIAvvqdduhw1f7RVxdcCmaCm5Zy7Osc)

## Links

- [Docs to get youtube playlist videos](https://developers.google.com/youtube/v3/docs/playlistItems/list)
- [Google API Dashboard](https://console.developers.google.com/apis/credentials?project=livefromquarantine)

## Preloaded Playlists

Preloaded playlists are fetched and preloaded with the built site via GitHub actions on a set interval. This can also be triggered via a `respository_dispatch` action. A quick script to do this is run via `npm run trigger`. The data is stored in the repo to make deploys faster and less likely to fall since the YouTube API has some transient errors sometimes.

## Adding a Preloaded Playlist

1. Add a file to `server/artists/ARTIST_ID.json` with at least `playlistId`, `id`, and `meta.title`
2. Add an entry to `client/artists.json` with a matching `id` and the `name` which will populate the button on the index page
3. Run `npm run data` to save the data to `server/preload`
4. This playlist will now be updated and built with the site each time

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
