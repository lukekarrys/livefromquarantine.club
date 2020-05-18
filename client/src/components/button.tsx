import { FunctionalComponent, h } from "preact"
import cx from "classnames"

interface Props extends JSX.HTMLAttributes {
  class?: string
  selected?: boolean
  tight?: boolean
  as?: string
}

const Button: FunctionalComponent<Props> = ({
  class: klass,
  selected,
  tight = true,
  as = "button",
  ...rest
}) => {
  return h(as, {
    class: cx(
      klass,
      selected
        ? "bg-gray-900 text-white"
        : "bg-white text-black hover:bg-gray-100",
      tight ? "p-1" : "py-1 px-2",
      "border rounded cursor-pointer border-gray-600 hover:shadow-md"
    ),
    ...rest,
  })
}

export default Button
