import axios, { AxiosError } from 'axios'
import parseDiff from 'parse-diff'
import { exec as _exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const exec = promisify(_exec)
const getId = (str: string) => {
  const matches = /^([+-])(ID:\s)?([\w-]{11})$/.exec(str)
  return matches && matches[3]
}

// https://stackoverflow.com/a/58110124/1290619
type Truthy<T> = T extends false | '' | 0 | null | undefined ? never : T
const truthy = <T>(value: T): value is Truthy<T> => !!value

const main = async () => {
  const { stdout, stderr } = await exec(
    'git diff HEAD^ HEAD server/data/parsed/',
    {
      cwd: path.resolve(__dirname, '..', '..'),
    }
  )

  if (stderr) {
    throw new Error(stderr)
  }

  const parsedDiff = parseDiff(stdout)
  console.log('Looking for ids in diff', JSON.stringify(parsedDiff, null, 2))

  const changes = parsedDiff.flatMap((f) => f.chunks.flatMap((c) => c.changes))

  const ids = changes
    .map((c) => c.type === 'add' && getId(c.content))
    .filter(truthy)
    .filter(
      // We only want *new* ids so this will check if any other lines in the diff
      // are for a line that deletes this id, meaning it was just a change and not new
      (id) => !changes.find((c) => c.type === 'del' && getId(c.content) === id)
    )

  console.log('Priming cache for ids:', ids)

  return Promise.all(
    ids.map((id) =>
      axios
        .get(`https://mp3.livefromquarantine.club/cache?id=${id}`)
        .then((res) => ({ id, status: res.status, data: res.data as unknown }))
        .catch((err: AxiosError) => {
          if (err.response) {
            return {
              id,
              status: err.response.status,
              data: err.response.data as unknown,
            }
          } else if (err.request) {
            return {
              id,
              status: null,
              data: 'REQUEST_ERROR',
            }
          } else {
            throw err
          }
        })
    )
  )
}

main()
  .then((res) => console.log(JSON.stringify(res, null, 2)))
  .catch(console.error)
