import { h } from "preact"
import { FunctionalComponent } from "preact"

const NextIcon: FunctionalComponent<{ height: number }> = ({ height }) => (
  <svg
    aria-hidden="true"
    focusable="false"
    data-prefix="fas"
    data-icon="forward"
    class="svg-inline--fa fa-forward fa-w-16"
    role="img"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    height={height}
  >
    <path
      fill="currentColor"
      d="M500.5 231.4l-192-160C287.9 54.3 256 68.6 256 96v320c0 27.4 31.9 41.8 52.5 24.6l192-160c15.3-12.8 15.3-36.4 0-49.2zm-256 0l-192-160C31.9 54.3 0 68.6 0 96v320c0 27.4 31.9 41.8 52.5 24.6l192-160c15.3-12.8 15.3-36.4 0-49.2z"
    ></path>
  </svg>
)

export default NextIcon
