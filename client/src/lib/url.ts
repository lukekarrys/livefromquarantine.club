export const parseQs = (str: string): Record<string, string> => {
  const obj: Record<string, string> = {}

  for (const [key, value] of new URLSearchParams(str)) {
    obj[key] = value
  }

  return obj
}

export const url = (
  path: string,
  search: { [key: string]: string | undefined }
): string => {
  if (search) path += '?'

  Object.entries(search).forEach((parts) => {
    if (parts[1] != null) {
      path += parts.join('=')
    }
  })

  return new URL(path, window.location.host).toString()
}
