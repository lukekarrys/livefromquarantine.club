const DEBUG =
  localStorage.getItem("debug") || process.env.NODE_ENV === "development"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const debug = (...args: any): void => {
  // eslint-disable-next-line no-console
  if (DEBUG) console.log(...args)
}

export default debug
