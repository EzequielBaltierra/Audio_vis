import emptyBoxIcon from '../../assets/EmptyBox.png'
import selectedColorIcon from '../../assets/SelectedColor.png'

export function ColorSwatchIcon({ color = null, selected = false }) {
  return (
    <span className="option-icon" aria-hidden="true">
      {color ? (
        <span
          className={selected
            ? 'option-icon__fill option-icon__fill--selected'
            : 'option-icon__fill option-icon__fill--empty'}
          style={{ backgroundColor: color }}
        />
      ) : null}
      <img
        className={selected ? 'option-icon__selected-color' : 'option-icon__empty'}
        src={selected ? selectedColorIcon : emptyBoxIcon}
        alt=""
      />
    </span>
  )
}
