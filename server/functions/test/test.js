const fs = require('fs').promises
const path = require('path')

const root = process.env.LAMBDA_TASK_ROOT

const tryIt = async (fn) => {
  try {
    const res = await fn()
    return res
  } catch (e) {
    return e.message
  }
}

exports.handler = async () => {
  let body = {}

  body.root = await tryIt(() => fs.readdir(path.join(root)))
  body.fn = await tryIt(() => fs.readdir(path.join(root, 'test')))
  body.src = await tryIt(() => fs.readdir(path.join(root, 'src')))
  body.server = await tryIt(() =>
    fs.readFile(path.join(root, 'src', 'SERVER.json'))
  )

  await fs.writeFile(path.join(root, 'src', 'SERVER.json'), '{}')

  return {
    statusCode: 200,
    body: JSON.stringify(body, null, 2),
  }
}
