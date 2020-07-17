const fs = require('fs').promises

const root = process.env.LAMBDA_TASK_ROOT
const fnName = 'test'

exports.handler = async () => {
  try {
    const dir = await fs.readdir(root)
    const dir2 = await fs.readdir(root, fnName)
    const file = await fs.readFile(root, fnName, 'benfolds.json')

    return {
      statusCode: 200,
      body: JSON.stringify({ dir, dir2, file }, null, 2),
    }
  } catch (e) {
    return {
      statusCode: 500,
      body: e.message,
    }
  }
}
