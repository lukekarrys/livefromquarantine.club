const fs = require('fs').promises
const path = require('path')

const root = process.env.LAMBDA_TASK_ROOT
const fnName = 'test'

const tryIt = async (fn) => {
  try {
    return await fn()
  } catch (e) {
    return e.message
  }
}

exports.handler = async () => {
  let body = {}

  body.dir = await tryIt(() => fs.readdir(path.join(root)))
  body.dir2 = await tryIt(() => fs.readdir(path.join(root, fnName)))

  return {
    statusCode: 200,
    body: JSON.stringify(body),
  }
}
