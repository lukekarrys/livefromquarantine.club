module.exports = {
  '*.{css,md,json}': ['prettier --write'],
  '*.{js,jsx,ts,tsx}': [
    `prettier --write`,
    `eslint --fix`,
    `jest --bail --findRelatedTests`,
  ],
  // Make this key different so it runs on the project instead
  // of just staged files
  '*.{js,jsx,ts,tsx,typescript}': () => 'tsc -p tsconfig.json --noEmit',
}
