const maxWidthContent = 890
const aspectRatio = 16 / 9
const maxVideoHeight = maxWidthContent * (1 / aspectRatio)

/**
 * @param {number} [min] - Start number
 * @param {number} [max] - End number
 *
 * @returns []{number} - Array of numbers
 */
const step = (min = 0, max = 1) =>
  new Array(max - min + 1).fill(null).map((__, i) => i + min)

module.exports = {
  purge: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      screens: {
        c: `${maxWidthContent}px`,
        'sm-h': { raw: `(min-height: ${maxVideoHeight}px)` },
        'md-h': { raw: `(min-height: ${maxVideoHeight * 2}px)` },
      },
      maxWidth: {
        0: '0px',
        ...step(1, 100).reduce((acc, i) => {
          acc[`video-16/9-${i}vh`] = `calc(${i}vh * ${aspectRatio})`
          return acc
        }, {}),
      },
    },
  },
  variants: {
    margin: ['responsive', 'first', 'last'],
  },
  plugins: [],
}
