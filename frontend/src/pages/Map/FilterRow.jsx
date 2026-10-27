import CategoryChip from '../../components/ui/CategoryChip'

// A small label and a row of chips. options: [{ value, label }]
export default function FilterRow({ label, options, value, onChange, tone }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-2">
      <span className="w-full text-xs font-semibold uppercase tracking-wider text-soft">
        {label}
      </span>
      {options.map((option) => (
        <CategoryChip
          key={option.value}
          label={option.label}
          tone={tone}
          active={value === option.value}
          onClick={() => onChange(option.value)}
        />
      ))}
    </div>
  )
}
