import { getFrequencyPalette } from '../../visualization/color/frequencyColors.js'
import { ColorSwatchIcon } from './ColorSwatchIcon.jsx'

export function ColorSectionSummary({ parameters }) {
  let colors = [parameters.color]
  if (parameters.colorMode === 'frequency') {
    colors = getFrequencyPalette(parameters)
  }

  return (
    <span
      className="color-section-summary"
      title={colors.join(' to ')}
      aria-hidden="true"
    >
      {colors.map((color, index) => (
        <ColorSwatchIcon color={color} selected key={`${color}-${index}`} />
      ))}
    </span>
  )
}
