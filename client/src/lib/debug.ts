export const DEBUG =
  localStorage.getItem('debug') || process.env.NODE_ENV === 'development'

export const log = (...args: unknown[]): void => {
  // eslint-disable-next-line no-console
  if (DEBUG) console.log(...args)
}

export const error = (...args: unknown[]): void => {
  // eslint-disable-next-line no-console
  if (DEBUG) console.error(...args)
}

export const group = (...args: unknown[]): void => {
  // eslint-disable-next-line no-console
  if (DEBUG) console.group(...args)
}

export const groupEnd = (): void => {
  // eslint-disable-next-line no-console
  if (DEBUG) console.groupEnd()
}

export default log
