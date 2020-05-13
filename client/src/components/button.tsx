import { FunctionalComponent, h } from "preact"
import cx from "classnames"

interface Props extends JSX.HTMLAttributes {
  class?: string
  selected?: boolean
  as?: string
}

const Button: FunctionalComponent<Props> = ({
  class: klass,
  selected,
  as = "button",
  ...rest
}) => {
  return h(as, {
    class: cx(
      klass,
      selected
        ? "bg-gray-900 text-white"
        : "bg-white text-black hover:bg-gray-100",
      "border p-1 rounded cursor-pointer border-gray-600 hover:shadow-md"
    ),
    ...rest,
  })
}

export default Button
