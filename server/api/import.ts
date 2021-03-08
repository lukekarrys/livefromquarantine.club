import path from 'path'

const tryExts = ['ts', 'js']

const getDefault = <T>(p: string) =>
  import(p).then<T>((r: { default: T }) => r.default)

// import files normally and return default export
// if no ext is provided lookup ts, then js
const importEnv = async <T>(p: string): Promise<T> => {
  const hasExt = path.extname(p)

  if (hasExt) {
    return getDefault<T>(p)
  }

  try {
    return getDefault<T>(`${p}.${tryExts[0]}`)
  } catch (e) {
    return await getDefault<T>(`${p}.${tryExts[1]}`)
  }
}

export default importEnv
