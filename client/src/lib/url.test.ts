import * as url from './url'

describe('Url utils', () => {
  test('parse search string', () => {
    const parsed = url.parseQs('?test=hello&test2=goodbye')
    expect(parsed).toEqual({
      test: 'hello',
      test2: 'goodbye',
    })
  })

  test('parse without ?', () => {
    const parsed = url.parseQs('test=hello&test2=goodbye')
    expect(parsed).toEqual({
      test: 'hello',
      test2: 'goodbye',
    })
  })

  test('parse empty string', () => {
    const parsed = url.parseQs('')
    expect(parsed).toEqual({})
  })

  test('creates relative url', () => {
    const newUrl = url.url('/test')
    expect(newUrl).toEqual('http://localhost:8080/test')
  })

  test('creates absolute url', () => {
    const newUrl = url.url('http://localhost:8081/test')
    expect(newUrl).toEqual('http://localhost:8081/test')
  })

  test('creates url with search obj', () => {
    const newUrl = url.url('/test', { test: 'hello', test2: 'hi' })
    expect(newUrl).toEqual('http://localhost:8080/test?test=hello&test2=hi')
  })

  test('creates url with search obj and hash', () => {
    const newUrl = url.url('/test?hey=now#test', { test: 'hello', test2: 'hi' })
    expect(newUrl).toEqual(
      'http://localhost:8080/test?hey=now&test=hello&test2=hi#test'
    )
  })

  test('can update search params', () => {
    const newUrl = url.url('/test?test=hello&test2=goodbye', { test2: 'hi' })
    expect(newUrl).toEqual('http://localhost:8080/test?test=hello&test2=hi')
  })
})
