module.exports = {
  '*.{css,md,json}': ['prettier --write'],
  '*.{js,ts}': [`prettier --write`, `eslint --fix`, `ava`],
  // Make this key different so it runs on the project instead
  // of just staged files
  '*.{js,ts,typescript}': () => 'tsc -p tsconfig.json --noEmit',
}