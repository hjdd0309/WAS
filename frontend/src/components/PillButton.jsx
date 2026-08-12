export default function PillButton({ children, className = '', ...props }) {
  return (
    <button
      className={`flex h-[72px] w-full items-center justify-center rounded-[22px] bg-accent text-[22px] font-semibold text-black transition-opacity active:opacity-70 disabled:pointer-events-none disabled:opacity-40 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
