import axios, { AxiosError } from 'axios'
import parseDiff from 'parse-diff'
import { exec as _exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import PQueue from 'p-queue'

const exec = promisify(_exec)

// https://stackoverflow.com/a/58110124/1290619
type Truthy<T> = T extends false | '' | 0 | null | undefined ? never : T
const truthy = <T>(value: T): value is Truthy<T> => !!value

const getId = (str: string) => {
  const matches = /^([+-])(ID:\s)?([\w-]{11})$/.exec(str)
  return matches && matches[3]
}

const main = async (command: string) => {
  console.log('Running command:', command)

  const { stdout, stderr } = await exec(command, {
    cwd: path.resolve(__dirname, '..', '..'),
  })

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

  const queue = new PQueue({ concurrency: 1 })
  const results: unknown[] = []

  await Promise.all(
    ids.map((id) =>
      queue.add(async () => {
        try {
          results.push(
            await axios
              .get(`https://mp3.livefromquarantine.club/cache?id=${id}`)
              .then((res) => ({
                id,
                status: res.status,
                data: res.data as unknown,
              }))
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
        } catch (e) {
          results.push(e)
        }
      })
    )
  )

  await queue.onIdle()

  return results
}

// Test with a known commit containing changes
const testCommand = 'git show 3ecf934 server/data/parsed'

// This will only work for the latest commit but that should work well enough since
// this only needs to be run for new data which gets commited as a single commit in a PR
const fullCommand = 'git diff HEAD^ HEAD server/data/parsed/'

main(process.env.NODE_ENV === 'test' ? testCommand : fullCommand)
  .then((res) => console.log('result', JSON.stringify(res, null, 2)))
  .catch(console.error)
