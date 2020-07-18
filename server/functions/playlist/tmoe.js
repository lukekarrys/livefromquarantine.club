module.exports = {
  parsers: {
    title: (title) =>
      title
        .replace(/The Tallest Man on Earth - /i, '')
        .replace(/#StayHome/i, '')
        .replace(/#WithMe/i, '')
        .trim(),
  },
  playlistId: 'PLsqIAvvqdduhw1f7RVxdcCmaCm5Zy7Osc',
  id: 'tmoe',
  meta: {
    title: 'The Tallest Man on Earth – #StayHome #WithMe',
  },
}
