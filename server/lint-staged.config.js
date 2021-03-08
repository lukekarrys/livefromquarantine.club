module.exports = {
  '*.{css,md,json}': ['prettier --write'],
  '*.{js,ts}': [`prettier --write`, `eslint --fix`],
  // Make this key different so it runs for all files
  // instead of just staged files
  '*.{js,ts,FOR_TESTING}': () => 'ava',
  '*.{js,ts,FOR_TYPESCRIPT}': () => 'tsc -p tsconfig.json --noEmit',
}
