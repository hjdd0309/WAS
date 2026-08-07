const variants = {
  primary: 'bg-accent text-white',
  ghost: 'bg-gray-50 text-gray-900',
}

export default function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}) {
  return (
    <button
      className={`h-14 w-full rounded-2xl text-base font-semibold transition-opacity active:opacity-70 disabled:pointer-events-none disabled:opacity-40 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
