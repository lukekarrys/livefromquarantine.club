import { FunctionalComponent, h } from 'preact'
import cx from 'classnames'

export enum InputType {
  Danger = 'danger',
}

interface Props extends JSX.HTMLAttributes {
  class?: string
  tight?: boolean
  as?: string
  inputType?: InputType
  disabled?: boolean
  rounded?: boolean
  border?: boolean
}

const Button: FunctionalComponent<Props> = ({
  class: klass,
  tight = true,
  inputType,
  as = 'input',
  disabled,
  rounded = true,
  border = true,
  ...rest
}) => {
  return h(as, {
    class: cx(
      klass,
      inputType === InputType.Danger
        ? ['border-red-600']
        : ['border-gray-600', 'text-black'],
      tight ? 'p-1' : 'py-1 px-2',
      rounded && 'rounded',
      border && 'border',
      'focus:outline-none focus:shadow-outline',
      disabled && 'opacity-50'
    ),
    disabled,
    ...rest,
  })
}

export default Button
