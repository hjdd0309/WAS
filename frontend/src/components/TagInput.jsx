import { useState } from 'react'

// 관심사처럼 짧은 태그를 여러 개 입력받는 칩 입력. Enter/쉼표로 추가,
// 각 칩의 × 버튼으로 제거. 백엔드 검증 한도(interests 최대 10개, 30자)에 맞춰
// 클라이언트에서도 동일하게 제한해 불필요한 요청 실패를 막는다.
export default function TagInput({
  value = [],
  onChange,
  placeholder,
  maxTags = 10,
  maxLength = 30,
}) {
  const [draft, setDraft] = useState('')

  const commit = (raw) => {
    const text = raw.trim().slice(0, maxLength)
    if (!text || value.length >= maxTags || value.includes(text)) return
    onChange([...value, text])
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit(draft)
      setDraft('')
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-[16px] border border-accent/40 bg-[#241e28] p-2.5">
      {value.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 rounded-full bg-accent/20 px-2.5 py-1 text-[13px] font-medium text-accent-soft"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((t) => t !== tag))}
            aria-label={`${tag} 삭제`}
            className="text-accent-soft/70 active:opacity-60"
          >
            ×
          </button>
        </span>
      ))}
      {value.length < maxTags && (
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            commit(draft)
            setDraft('')
          }}
          placeholder={value.length === 0 ? placeholder : ''}
          maxLength={maxLength}
          className="min-w-[80px] flex-1 bg-transparent text-[16px] text-white outline-none placeholder:text-white/30"
        />
      )}
    </div>
  )
}
