import { Artist } from '../../types'

const artist: Artist = {
  parsers: {
    title: (title) =>
      title
        .replace(/The Tallest Man on Earth - /i, '')
        .replace(/#StayHome/i, '')
        .replace(/#WithMe/i, ''),
    UgxzB_li_R0EbWlG2614AaABAg: (text) =>
      text.replace(
        'Kristian puts a chair on his head 1:08:12',
        'Kristian puts a chair on his head\n1:08:12'
      ),
  },
  omitVideoIds: [
    'odXvJJcoo9w', // A non music video (mistakenly?) added to the playlist
  ],
  playlistId: 'PLsqIAvvqdduhw1f7RVxdcCmaCm5Zy7Osc',
  id: 'tmoe',
  meta: {
    title: 'The Tallest Man on Earth – #StayHome #WithMe',
  },
  comments: {
    '37uYSek4r-0': [
      '3:33 The Bluest Eyes in Texas - Restless Heart\n9:13 I Waited for You - Daniel Norgren\n15:51 Blues Run The Game - Jackson C. Frank\n22:19 Fade Into You - Mazzy Star\n29:09 Come in From The Cold - Joni Mitchell\n34:50 Two Headed Boy/In The Aeroplane Over The Sea/The King of Carrot Flowers - Neutral Milk Hotel\n41:08 Unbelievers - Vampire Weekend\n49:05 The Roving - Bonny Light Horseman\n56:16 Re:Stacks - Bon Iver\n1:06:00 Secret Heart - Ron Sexsmith\n1:15:40 These Days - Jackson Browne\n1:24:09 When We Were Young - Adele',
    ],
  },
}

export default artist
