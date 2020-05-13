import { resolve } from "path"
import tailwind from "tailwindcss"

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
    helpers.getLoadersByName(config, "postcss-loader").forEach(({ loader }) => {
      const plugins = loader.options.plugins
      // Add tailwind css at the top.
      plugins.unshift(tailwind)
    })

    // Where we're going, we don't need compat
    // (remember to check here if adding any future react libraries)
    config.resolve.alias.react = resolve(
      process.cwd(),
      "src",
      "lib",
      "preact.js"
    )
    ;[
      "react-dom",
      "react-addons-css-transition-group",
      "preact-compat",
      "preact/compat",
    ].forEach((k) => delete config.resolve.alias[k])

    // Use any `index` file, not just index.js
    config.resolve.alias["preact-cli-entrypoint"] = resolve(
      process.cwd(),
      "src",
      "index"
    )
  },
}
