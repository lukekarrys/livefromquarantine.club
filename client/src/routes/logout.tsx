import { FunctionalComponent } from 'preact'
import { useEffect } from 'preact/hooks'

const Logout: FunctionalComponent = () => {
  useEffect(() => {
    localStorage.removeItem('accessToken')
    window.location.href = `${window.location.origin}/`
  }, [])

  return null
}

export default Logout
