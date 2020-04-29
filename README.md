
## Links
- [AJJ Playlist](https://www.youtube.com/playlist?list=PLRSI_QNxGZ2lZP141po9tLGpLqM6ciuP1)
- [Docs to get youtube playlist videos](https://developers.google.com/youtube/v3/docs/playlistItems/list)

## Get Data
Run this to get `raw.json`:

```sh
curl https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=[PLAYLIST_ID]&key=[YOUR_API_KEY] > raw.json
```

Then run thiss to save `public/parsed.js`

```sh
node parse-data.js > public/parsed.js
```
