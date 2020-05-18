import { FunctionalComponent, h } from "preact"
import { Tracks, Track } from "../types"

interface Props {
  tracks: Tracks
  onClear: () => void
  onSelectTrack: (track: Track) => void
}

const UpNext: FunctionalComponent<Props> = ({
  tracks,
  onClear,
  onSelectTrack,
}) => {
  return (
    <div>
      <h3>Upnext ({tracks?.length || 0})</h3>
      <button onClick={onClear}>Clear</button>
      {tracks.map((track) => (
        <button key={track.id} onClick={(): void => onSelectTrack(track)}>
          {Array.isArray(track.title) ? track.title.join(" - ") : track.title}
        </button>
      ))}
    </div>
  )
}

export default UpNext
