exports.handler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ env: process.env, message: 'test' }),
  }
}
