import path from 'path'

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
    return await getDefault<T>(`${p}.ts`)
  } catch (e) {
    return await getDefault<T>(`${p}.js`)
  }
}

export default importEnv
