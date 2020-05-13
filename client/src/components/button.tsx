import { FunctionalComponent, h } from "preact"
import cx from "classnames"

interface Props extends JSX.HTMLAttributes<HTMLButtonElement> {
  class?: string
  selected?: boolean
}

const Button: FunctionalComponent<Props> = ({
  class: klass,
  selected,
  ...rest
}) => {
  return (
    <button
      class={cx(
        klass,
        selected
          ? "bg-gray-900 text-white"
          : "bg-white text-black hover:bg-gray-100",
        "border p-1 rounded cursor-pointer border-gray-600 hover:shadow-md"
      )}
      {...rest}
    />
  )
}

export default Button
