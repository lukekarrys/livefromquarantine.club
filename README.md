
## Links
- [AJJ Playlist](https://www.youtube.com/playlist?list=PLRSI_QNxGZ2lZP141po9tLGpLqM6ciuP1)
- [Docs to get youtube playlist videos](https://developers.google.com/youtube/v3/docs/playlistItems/list)

## Get Data
Run this to get `raw.json`:

```sh
curl \
  'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=PLRSI_QNxGZ2lZP141po9tLGpLqM6ciuP1&key=[YOUR_API_KEY]' \
  --header 'Authorization: Bearer [YOUR_ACCESS_TOKEN]' \
  --header 'Accept: application/json' \
  --compressed
```

Then run `node parse-data.js` which saves data to `public/parsed.js`