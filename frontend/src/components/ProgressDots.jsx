export default function ProgressDots({ total, activeIndex }) {
  return (
    <div className="flex items-center justify-center gap-[9px]">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`size-3 rounded-full transition-colors ${
            i === activeIndex ? 'bg-accent' : 'bg-[#4b4750]'
          }`}
        />
      ))}
    </div>
  )
}
