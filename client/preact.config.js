/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// @ts-nocheck

import { resolve } from 'path'
import tailwind from 'tailwindcss'
import { DefinePlugin } from 'webpack'

const PRODUCTION = process.env.NODE_ENV === 'production'

export default {
  /**
   * Function that mutates the original webpack config.
   * Supports asynchronous changes when a promise is returned (or it's an async function).
   *
   * @param {object} config - original webpack config.
   * @param {object} env - options passed to the CLI.
   * @param {WebpackConfigHelpers} helpers - object with useful helpers for working with the webpack config.
   * @param {object} options - this is mainly relevant for plugins (will always be empty in the config), default to an empty object
   **/
  webpack(config, env, helpers) {
    helpers.getLoadersByName(config, 'postcss-loader').forEach(({ loader }) => {
      const plugins = loader.options.plugins
      // Add tailwind css at the top.
      plugins.unshift(tailwind)
    })

    config.plugins.push(
      new DefinePlugin({
        'process.env.MEDIA_SERVER': JSON.stringify(
          PRODUCTION ? 'http://143.198.54.155' : 'http://localhost:3002'
        ),
      })
    )

    if (config.devServer) {
      // YouTube player blocks some videos on 0.0.0.0
      config.devServer.host = 'localhost'
      config.devServer.port = 3000
      // Hot reloading doesn't play well with the video player
      config.devServer.hot = false
      config.devServer.proxy = {
        '/.netlify/functions': {
          target: 'http://localhost:3001',
          pathRewrite: { [`^/.netlify/functions`]: '/' },
        },
      }
    }

    // Where we're going, we don't need compat
    // (remember to check here this file if adding any future react libraries)
    config.resolve.alias.react = resolve(process.cwd(), 'src', 'lib', 'preact')

    // No external libraries use any of these so they dont need to be
    // aliased
    const removeAliases = [
      'react-dom',
      'react-addons-css-transition-group',
      'preact-compat',
      'preact/compat',
    ]
    removeAliases.forEach((k) => delete config.resolve.alias[k])

    // Use any `index` file, not just index.js
    config.resolve.alias['preact-cli-entrypoint'] = resolve(
      process.cwd(),
      'src',
      'index'
    )
  },
}
