import mainLogo from '../../assets/illustrations/main-logo.png'

export default function CallConnecting({ status, errorMessage, persona, onRetry, onCancel }) {
  const isError = status === 'error'

  if (isError) {
    return (
      <div
        className="flex h-full w-full flex-col items-center"
        style={{ backgroundImage: 'linear-gradient(160deg, #4a3d5c 0%, #241e28 45%, #000 100%)' }}
      >
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <img
            src={mainLogo}
            alt="위스피"
            className="h-[130px] w-[127px] rounded-[34px] border border-[#444] object-cover shadow-[0_4px_20px_rgba(177,144,234,0.5)]"
          />
          <p className="text-[19px] font-bold text-white">연결에 실패했어요</p>
          <p className="whitespace-pre-line text-[14px] leading-[1.6] text-white/60">{errorMessage}</p>
        </div>
        <div className="flex w-full flex-col gap-3 px-6 pb-10">
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
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-3 px-8 text-center"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 70% 50% at 50% 45%, rgba(177,144,234,0.28) 0%, rgba(27,23,28,0) 65%), #1b171c',
      }}
    >
      <p className="text-[20px] text-[#b9b9b9]">연결 중...</p>
      <p className="text-[45px] font-extrabold text-white">{persona ? persona.name : '위스피'}</p>
    </div>
  )
}
