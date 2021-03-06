export const parseQs = (str: string): { [key: string]: string } => {
  return [...new URLSearchParams(str).entries()].reduce((acc, [k, v]) => {
    acc[k] = v
    return acc
  }, {} as { [key: string]: string })
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
