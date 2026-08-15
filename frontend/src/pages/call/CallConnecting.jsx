import mainLogo from '../../assets/illustrations/main-logo.png'

export default function CallConnecting({ status, errorMessage, persona, onRetry, onCancel }) {
  const isError = status === 'error'

  return (
    <div
      className="flex h-full w-full flex-col items-center"
      style={{
        backgroundImage: isError
          ? 'linear-gradient(160deg, #4a3d5c 0%, #241e28 45%, #000 100%)'
          : 'linear-gradient(160deg, #b190ea 0%, #645184 45%, #000 100%)',
      }}
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
        <img
          src={mainLogo}
          alt="위스피"
          className="h-[130px] w-[127px] rounded-[34px] border border-[#444] object-cover shadow-[0_4px_20px_rgba(177,144,234,0.5)]"
        />
        {isError ? (
          <>
            <p className="text-[19px] font-bold text-white">연결에 실패했어요</p>
            <p className="text-[14px] leading-[1.6] text-white/60">{errorMessage}</p>
          </>
        ) : (
          <p className="text-[23px] font-extrabold text-white">
            {persona ? `${persona.name}이(가) 전화를 걸고 있어요` : '잠깐만'}
          </p>
        )}
      </div>

      <div className="flex w-full flex-col gap-3 px-6 pb-10">
        {isError ? (
          <>
            <button
              onClick={onRetry}
              className="h-[56px] w-full rounded-[18px] bg-accent text-[16px] font-semibold text-black active:opacity-70"
            >
              다시 시도
            </button>
            <button
              onClick={onCancel}
              className="h-[56px] w-full rounded-[18px] bg-white/10 text-[16px] font-semibold text-white active:opacity-70"
            >
              그만두기
            </button>
          </>
        ) : (
          <p className="text-center text-[13px] text-white/50">
            {persona ? `${persona.emoji} 연결하는 중...` : '연결하는 중...'}
          </p>
        )}
      </div>
    </div>
  )
}
