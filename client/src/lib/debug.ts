const DEBUG =
  localStorage.getItem("debug") || process.env.NODE_ENV === "development"

// eslint-disable-next-line @typescript-eslint/no-explicit-any, no-console
export const log = (...args: any): void => void (DEBUG && console.log(...args))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const error = (...args: any): void =>
  // eslint-disable-next-line no-console
  void (DEBUG && console.error(...args))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const group = (...args: any): void =>
  // eslint-disable-next-line no-console
  void (DEBUG && console.group(...args))

// eslint-disable-next-line no-console
export const groupEnd = (): void => void (DEBUG && console.groupEnd())

export default log
