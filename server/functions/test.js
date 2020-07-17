const fs = require('fs').promises
const path = require('path')

const resolved = (f) =>
  process.env.LAMBDA_TASK_ROOT
    ? path.resolve(process.env.LAMBDA_TASK_ROOT, f)
    : path.resolve(__dirname, f)

exports.handler = async () => {
  console.log(process.env.LAMBDA_TASK_ROOT)

  const p = resolved('../../public/api/tmoe.json')

  console.log(p)

  try {
    const res = await fs.readFile(p)
    console.log(res)
  } catch (e) {
    console.log(e)
  }

  return {
    statusCode: 200,
    body: 'ok',
  }
}
