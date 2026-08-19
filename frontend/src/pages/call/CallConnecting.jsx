import wispyMascot from '../../assets/illustrations/ghost-image-1.png'

// 통화 연결 실패(네트워크/세션/접속 폭주/마이크 권한/WebRTC 등 모든 에러 공통)에
// 보여주는 슬픈 위스피. 새로 그리는 대신 통화 중 화면과 완전히 같은 원본
// 이미지를 그대로 쓰고, 원본의 놀란 "o"자 입 위치만 실측(좌표는 ghost-image-1.png를
// 캔버스로 픽셀 분석해 얻음: 입 중심 49.8%/60.5%, 눈 중심 41.3%·58.2%/44%)해
// 가리고 처진 입 + 눈물로 덮어 그린다. 헤드폰/눈/손짓 등 나머지는 원본과 100% 동일.
function SadWispy() {
  return (
    <div className="relative w-[190px]" style={{ aspectRatio: '1214 / 1130' }}>
      <img src={wispyMascot} alt="위스피" className="h-full w-full object-contain" />
      <svg viewBox="0 0 1214 1130" className="absolute inset-0 h-full w-full">
        <defs>
          <filter id="sadWispyMouthSoften" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
        <circle cx="605" cy="684" r="112" fill="#060408" filter="url(#sadWispyMouthSoften)" />
        <path d="M539,690 c22,-40 110,-40 132,0" stroke="#b190ea" strokeWidth="38" strokeLinecap="round" fill="none" />
        <path
          d="M700,522 c18,25.2 18,46.8 0,61.2 a16.2,16.2 0 0 1 -25.2,0 c-18,-14.4 -18,-36 0,-61.2 7.2,-10.8 18,-10.8 25.2,0 Z"
          fill="#8fd3ff"
          opacity="0.9"
        />
      </svg>
    </div>
  )
}

export default function CallConnecting({ status, errorMessage, persona, onRetry, onCancel }) {
  const isError = status === 'error'

  if (isError) {
    return (
      <div
        className="flex h-full w-full flex-col items-center"
        style={{ backgroundImage: 'linear-gradient(160deg, #4a3d5c 0%, #241e28 45%, #000 100%)' }}
      >
        <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
          <SadWispy />
          <p className="whitespace-pre-line text-[19px] font-bold text-white">{errorMessage}</p>
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
