import { FunctionalComponent, h } from 'preact'
import cx from 'classnames'

export enum ButtonType {
  Danger = 'danger',
}

interface Props extends JSX.HTMLAttributes {
  class?: string
  selected?: boolean
  tight?: boolean
  as?: string
  type?: ButtonType
  disabled?: boolean
}

const Button: FunctionalComponent<Props> = ({
  class: klass,
  selected,
  tight = true,
  type,
  as = 'button',
  disabled,
  ...rest
}) => {
  return h(as, {
    class: cx(
      klass,
      type === ButtonType.Danger
        ? ['border-red-600 bg-red-200', !disabled && 'hover:bg-red-400']
        : [
            'border-gray-600',
            selected
              ? 'bg-gray-900 text-white'
              : ['bg-white text-black', !disabled && 'hover:bg-gray-300'],
          ],
      tight ? 'p-1' : 'py-1 px-2',
      'border rounded focus:outline-none focus:shadow-outline',
      disabled ? 'opacity-50 cursor-default' : 'hover:shadow cursor-pointer'
    ),
    disabled,
    ...rest,
  })
}

export default Button
