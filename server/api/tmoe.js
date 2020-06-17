module.exports.parsers = {
  title: (title) =>
    title
      .replace(/The Tallest Man on Earth - /i, '')
      .replace(/#StayHome/i, '')
      .replace(/#WithMe/i, '')
      .trim(),
}

module.exports.meta = {
  title: 'The Tallest Man on Earth – #StayHome #WithMe',
  description: 'All The Tallest Man on Earth Stay Home With Me songs',
  id: 'tmoe',
  playlistId: 'PLsqIAvvqdduhw1f7RVxdcCmaCm5Zy7Osc',
}
