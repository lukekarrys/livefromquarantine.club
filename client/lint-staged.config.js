module.exports = {
  '*.{css,md,json}': ['prettier --write'],
  '*.{js,jsx,ts,tsx}': [`prettier --write`, `eslint --fix`],
  // Make this key different so it runs for all files
  // instead of just staged files
  '*.{js,jsx,ts,tsx,FOR_TESTING}': () => `jest --bail`,
  '*.{js,jsx,ts,tsx,FOR_TYPESCRIPT}': () => 'tsc -p tsconfig.json --noEmit',
}
