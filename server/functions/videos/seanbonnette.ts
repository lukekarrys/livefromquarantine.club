import { Artist } from '../../types'

const artist: Artist = {
  id: 'seanbonnette',
  playlistId: 'PLRSI_QNxGZ2lZP141po9tLGpLqM6ciuP1',
  meta: {
    title: 'Sean Bonnette – Live From Quarantine',
    description: [
      '<a href="http://www.patreon.com/ajjtheband" target="_blank">Patreon</a>',
      '<a href="https://venmo.com/bonnseanette" target="_blank">Venmo</a>',
      '<a href="https://paypal.me/bonnseanette" target="_blank">Paypal</a>',
      '<a href="https://cash.app/$bonnseanette" target="_blank">Cash App</a>',
      '<a href="http://shop.ajjtheband.com" target="_blank">Merch</a>',
    ].join(''),
  },
  titleParser: (title) => title.replace(/Live from Quarantine[\s-]+-?/i, ''),
  videoParsers: {
    PmJa6qlob0Q: {
      comments: `0:42 A Big Day for Grimley\n4:23 Oo-de-lally`,
    },
  },
  omitCommentIds: [
    'UgzHFsG1E5peX5zKYCJ4AaABAg', // June 22. No setlist but this comment has some timestamps
  ],
}

export default artist
