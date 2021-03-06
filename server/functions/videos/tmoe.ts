import { Artist } from '../../types'

const artist: Artist = {
  id: 'tmoe',
  playlistId: 'PLsqIAvvqdduhw1f7RVxdcCmaCm5Zy7Osc',
  meta: {
    title: 'The Tallest Man on Earth – #StayHome #WithMe',
  },
  titleParser: (title) =>
    title
      .replace(/The Tallest Man on Earth - /i, '')
      .replace(/#StayHome/i, '')
      .replace(/#WithMe/i, ''),
  videoParsers: {
    '37uYSek4r-0': {
      comments: `3:33 The Bluest Eyes in Texas - Restless Heart
        9:13 I Waited for You - Daniel Norgren
        15:51 Blues Run The Game - Jackson C. Frank
        22:19 Fade Into You - Mazzy Star
        29:09 Come in From The Cold - Joni Mitchell
        34:50 Two Headed Boy/In The Aeroplane Over The Sea/The King of Carrot Flowers - Neutral Milk Hotel
        41:08 Unbelievers - Vampire Weekend
        49:05 The Roving - Bonny Light Horseman
        56:16 Re:Stacks - Bon Iver
        1:06:00 Secret Heart - Ron Sexsmith
        1:15:40 These Days - Jackson Browne
        1:24:09 When We Were Young - Adele`,
    },
  },
  omitVideoIds: [
    'odXvJJcoo9w', // A non music video (mistakenly?) added to the playlist
  ],
  commentParsers: {
    UgxzB_li_R0EbWlG2614AaABAg: (text) =>
      text.replace(
        'Kristian puts a chair on his head 1:08:12',
        'Kristian puts a chair on his head\n1:08:12'
      ),
  },
}

export default artist
