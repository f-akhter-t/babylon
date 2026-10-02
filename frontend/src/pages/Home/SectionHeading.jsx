export default function SectionHeading({ eyebrow, title, children }) {
  return (
    <div className="flex items-end justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-forest">
          {eyebrow}
        </p>
        <h2 className="mt-2 font-heading text-5xl font-extrabold text-navy">{title}</h2>
      </div>
      {children}
    </div>
  )
}