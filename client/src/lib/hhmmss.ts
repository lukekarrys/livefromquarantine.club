const pad = (s: string | number): string => {
  const str = s.toString()
  return str.length === 2 ? str : `0${str}`
}

const hhmmss = (s: number): string => {
  const hours = Math.floor(s / 3600)
  s %= 3600
  const minutes = Math.floor(s / 60)
  const seconds = s % 60
  return `${hours ? `${hours}:` : ''}${
    minutes ? (hours ? pad(minutes) : minutes) : '0'
  }:${pad(Math.round(seconds))}`
}

export default hhmmss
