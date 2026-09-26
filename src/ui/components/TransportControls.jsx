function formatTime(timeSeconds) {
  if (!Number.isFinite(timeSeconds)) return '00:00'
  const minutes = Math.floor(timeSeconds / 60)
  const seconds = Math.floor(timeSeconds % 60)
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export function TransportControls({
  disabled,
  isPlaying,
  currentTime,
  duration,
  loop,
  loopDisabled,
  muted,
  muteDisabled = false,
  onPlayPause,
  onSeek,
  onToggleLoop,
  onToggleMute,
}) {
  const segmentCount = 52
  const progress = duration ? currentTime / duration : 0
  const completed = Math.round(progress * segmentCount)

  return (
    <div className="transport">
      <button type="button" disabled={disabled} onClick={onPlayPause}>
        {isPlaying ? '[ PAUSE ]' : '[ PLAY ]'}
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onSeek(Math.max(0, currentTime - 5))}
        aria-label="Seek backward five seconds"
      >
        {'<-'}
      </button>
      <span className="timecode">{formatTime(currentTime)}</span>
      <div className="ascii-timeline">
        <span aria-hidden="true">[</span>
        <span className="ascii-timeline__track" aria-hidden="true">
          {Array.from({ length: segmentCount }, (_, index) => (
            <span className={index < completed ? 'is-complete' : ''} key={index}>
              {index < completed ? '=' : '-'}
            </span>
          ))}
        </span>
        <span aria-hidden="true">]</span>
        <input
          type="range"
          min="0"
          max={duration || 0}
          step="0.01"
          value={Math.min(currentTime, duration || 0)}
          disabled={disabled}
          onChange={(event) => onSeek(Number(event.target.value))}
          aria-label="Playback position"
        />
      </div>
      <span className="timecode">{formatTime(duration)}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onSeek(Math.min(duration, currentTime + 5))}
        aria-label="Seek forward five seconds"
      >
        {'->'}
      </button>
      <button
        type="button"
        className={loop ? 'is-active' : ''}
        disabled={loopDisabled}
        aria-pressed={loop}
        onClick={onToggleLoop}
      >
        {loop ? '[ LOOP: ON ]' : '[ LOOP: OFF ]'}
      </button>
      <button
        type="button"
        disabled={muteDisabled}
        aria-pressed={muted}
        onClick={onToggleMute}
      >
        {muted ? '[ UNMUTE ]' : '[ MUTE ]'}
      </button>
    </div>
  )
}
