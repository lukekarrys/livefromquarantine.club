const fs = require('fs').promises
const path = require('path')

const root = process.env.LAMBDA_TASK_ROOT

const tryIt = async (fn) => {
  try {
    return await fn()
  } catch (e) {
    return e.message
  }
}

exports.handler = async () => {
  let body = {}

  body.root = await tryIt(() => fs.readdir(path.join(root)))
  body.src = await tryIt(() => fs.readdir(path.join(root, 'src')))

  return {
    statusCode: 200,
    body: JSON.stringify(body, null, 2),
  }
}
