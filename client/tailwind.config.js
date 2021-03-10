/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-call */

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

const assign = (...objs) => Object.assign({}, ...objs)

const safeRule = (rule) => ({ addUtilities, e, theme, variants }) => {
  const suffix = 'safe'
  const id = rule[0] // first char like 'p' or 'm'

  const generator = (size, modifier) => {
    const declaration = (pos) => ({
      [`${rule}-${pos}`]: `max(${size}, env(safe-area-inset-${pos}))`,
    })

    const className = (char = '') =>
      // .p(x|y|...)-(1|2|3|...)-safe {}
      `.${e(`${id}${char}-${modifier}-${suffix}`)}`

    const top = declaration('top')
    const bottom = declaration('bottom')
    const left = declaration('left')
    const right = declaration('right')

    return {
      [`@supports(${rule}: max(0px))`]: {
        [className()]: assign(top, bottom, left, right),
        [className('y')]: assign(top, bottom),
        [className('x')]: assign(left, right),
        [className('t')]: top,
        [className('r')]: right,
        [className('b')]: bottom,
        [className('l')]: left,
      },
    }
  }

  addUtilities(
    Object.entries(theme(rule, {})).map(([modifier, size]) =>
      generator(size, modifier)
    ),
    variants(rule)
  )
}

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
    margin: ['responsive', 'first'],
  },
  plugins: [safeRule('padding'), safeRule('margin')],
}
