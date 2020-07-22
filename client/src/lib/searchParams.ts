export const stringify = (obj: {
  [key: string]: string | undefined
}): string => {
  const p = new URLSearchParams()
  Object.entries(obj).forEach(([k, v]) => v !== undefined && p.set(k, v))
  return p.toString()
}

export const parse = (str: string): { [key: string]: string } => {
  const params: { [key: string]: string } = {}
  const regex = /([^&=]+)=([^&]*)/g

  let m: RegExpExecArray | null = null
  while ((m = regex.exec(str))) {
    params[decodeURIComponent(m[1])] = decodeURIComponent(m[2])
  }

  return params
}
