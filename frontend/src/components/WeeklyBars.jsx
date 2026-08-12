// 요일별 막대 그래프. value는 0~1 사이 상대값, highlightIndex가 강조(보라) 막대.
export default function WeeklyBars({ data, highlightIndex }) {
  return (
    <div className="flex h-[92px] items-end justify-between gap-2">
      {data.map((d, i) => (
        <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-[64px] w-full items-end justify-center">
            <div
              className={`w-full max-w-[18px] rounded-full transition-all ${
                i === highlightIndex ? 'bg-accent' : 'bg-white/15'
              }`}
              style={{ height: `${Math.max(d.value, 0.08) * 100}%` }}
            />
          </div>
          <span className={`text-[10px] ${i === highlightIndex ? 'text-white' : 'text-[#767676]'}`}>
            {d.day}
          </span>
        </div>
      ))}
    </div>
  )
}
