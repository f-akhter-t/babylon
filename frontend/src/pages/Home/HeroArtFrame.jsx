// Shared frame for the slide pictures: two colored layers and a mint border.
// Same size as HeroMapArt, so slides line up.
export default function HeroArtFrame({ children }) {
  return (
    <div className="relative mx-auto aspect-[620/440] w-full max-w-[620px] xl:mx-0">
      <div className="absolute inset-0 -translate-x-2 translate-y-2 rounded-hero bg-forest md:-translate-x-6 md:translate-y-6 xl:-translate-x-11 xl:translate-y-11" />
      <div className="absolute inset-0 -translate-x-1 translate-y-1 rounded-hero bg-slate md:-translate-x-3 md:translate-y-3 xl:-translate-x-5.5 xl:translate-y-5.5" />
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-hero border-4 border-mint bg-mint-deep p-3 sm:p-6">
        {children}
      </div>
    </div>
  )
}
