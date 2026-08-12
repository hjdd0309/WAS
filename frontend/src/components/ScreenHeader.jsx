export default function ScreenHeader({ title, subtitle }) {
  return (
    <div className="mt-2">
      <h1 className="text-[26px] font-bold text-white">{title}</h1>
      {subtitle && <p className="mt-1 text-[14px] text-[#919191]">{subtitle}</p>}
    </div>
  )
}
