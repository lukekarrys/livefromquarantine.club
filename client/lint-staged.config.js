module.exports = {
  '*.{css,md,json}': ['prettier --write'],
  '*.{js,jsx,ts,tsx}': [`prettier --write`, `eslint --fix`],
  // Make this key different so it runs on the whole project instead
  // of just staged files
  '*.{js,jsx,ts,tsx,FORJESTTESTS}': () => `jest --bail`,
  '*.{js,jsx,ts,tsx,TYPESCRIPT}': () => 'tsc -p tsconfig.json --noEmit',
}
