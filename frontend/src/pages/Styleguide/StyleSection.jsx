export default function StyleSection({ title, children }) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 font-heading text-xl font-extrabold text-navy">
        {title}
      </h2>
      {children}
    </section>
  )
}