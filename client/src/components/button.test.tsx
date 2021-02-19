import { h } from 'preact'
import { render } from '@testing-library/preact'
import Button from './button'

describe('Button', () => {
  test('Selected', () => {
    const {
      container: { firstChild: buttonNode },
    } = render(<Button selected />)
    expect(buttonNode).toHaveClass('text-white')
    expect(buttonNode).not.toHaveClass('text-black')
  })

  test('Not Selected', () => {
    const {
      container: { firstChild: buttonNode },
    } = render(<Button />)
    expect(buttonNode).toHaveClass('text-black')
    expect(buttonNode).not.toHaveClass('text-white')
  })
})
