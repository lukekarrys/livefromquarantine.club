export const pick = <T, K extends keyof T>(
  obj: T,
  ...keys: K[]
): Pick<T, K> => {
  const ret: T = {} as T
  keys.forEach((key) => {
    ret[key] = obj[key]
  })
  return ret
}
