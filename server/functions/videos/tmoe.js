module.exports = {
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
  playlistId: 'PLsqIAvvqdduhw1f7RVxdcCmaCm5Zy7Osc',
  id: 'tmoe',
  meta: {
    title: 'The Tallest Man on Earth – #StayHome #WithMe',
  },
}
