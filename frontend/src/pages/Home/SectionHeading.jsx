export default function SectionHeading({ eyebrow, title, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-forest">
          {eyebrow}
        </p>
        <h2 className="mt-2 font-heading text-[34px] font-extrabold leading-none tracking-[-0.035em] text-navy sm:text-[44px] xl:text-[52px]">
          {title}
        </h2>
      </div>
      {children}
    </div>
  )
}