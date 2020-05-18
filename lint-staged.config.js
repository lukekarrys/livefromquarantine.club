const path = require('path')
const isClient = (p) => p.startsWith(path.join(__dirname, 'client'))
const quote = (arr) => arr.map((p) => `'${p}'`)

const prettier = (files) => {
  const quotedFiles = quote(files)
  return [`prettier --write ${quotedFiles}`]
}

const javascript = (files) => {
  const quotedFiles = quote(files)
  return [
    ...prettier(files),
    `eslint --fix ${quotedFiles}`,
    `jest --bail --findRelatedTests ${quotedFiles}`,
  ]
}

const joinCommands = (commands) => {
  return commands.join(' && ')
}

module.exports = {
  'client/**/*.{css,md,json}': (filePaths) => {
    console.log(filePaths)
    return joinCommands(['cd client', ...prettier(filePaths)])
  },
  'client/**/*.{js,jsx,ts,tsx}': (filePaths) => {
    console.log(filePaths)
    return joinCommands(['cd client', ...javascript(filePaths)])
  },
  '*.{css,md,json}': (filePaths) => {
    console.log(filePaths)
    return joinCommands(prettier(filePaths.filter((p) => !isClient(p))))
  },
  '*.{js,jsx,ts,tsx}': (filePaths) => {
    console.log(filePaths)
    return joinCommands(javascript(filePaths.filter((p) => !isClient(p))))
  },
}
