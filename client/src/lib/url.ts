export const parseQs = (
  toParse?:
    | string
    | Record<string, string | undefined>
    | undefined
    | URLSearchParams
): Record<string, string> => {
  let params: URLSearchParams | null = null

  if (toParse instanceof URLSearchParams) {
    params = toParse
  } else if (typeof toParse === 'object') {
    const removeUndefinedValues: Record<string, string> = {}
    for (const [key, val] of Object.entries(toParse)) {
      if (val != null) {
        removeUndefinedValues[key] = val
      }
    }
    params = new URLSearchParams(removeUndefinedValues)
  } else if (typeof toParse === 'string') {
    const parts = toParse.split('?')
    params = new URLSearchParams(parts[1] || parts[0])
  } else {
    params = new URLSearchParams(toParse)
  }

  return Array.from(params.entries()).reduce((acc, [k, v]) => {
    acc[k] = v
    return acc
  }, {} as Record<string, string>)
}

const relativeUrl = (u: string): URL => {
  return new URL(u, `${window.location.protocol}//${window.location.host}`)
}

export const url = (
  path: string,
  search?: Record<string, string | undefined>
): string => {
  const url = relativeUrl(path)
  url.search = new URLSearchParams({
    ...parseQs(url.search),
    ...parseQs(search),
  }).toString()
  return url.toString()
}
