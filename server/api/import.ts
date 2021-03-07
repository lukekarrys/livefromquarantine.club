import path from 'path'
import detectTSNode from 'detect-ts-node'

const ext = detectTSNode ? 'ts' : 'js'

// import files normally and return default export
// if no ext is provided lookup ts or js based on env
const importEnv = <T>(p: string): Promise<T> =>
  import(path.extname(p) ? p : `${p}.${ext}`).then(
    (r: { default: T }) => r.default
  )

export default importEnv
