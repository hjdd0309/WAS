import { Component } from 'react'

// 런타임 에러가 나도 흰 화면 대신 복구 가능한 화면을 보여준다.
// 통화 중 WebRTC/브라우저 API 예외처럼 예측하기 어려운 실패까지 전부
// try/catch로 잡아내긴 어려우므로, 최후의 방어선으로 둔다.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('unhandled UI error', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-dvh w-full flex-col items-center justify-center gap-4 bg-[#f2f4f6] px-8 text-center">
          <span className="text-4xl">😵</span>
          <p className="text-[17px] font-bold text-gray-900">문제가 발생했어요</p>
          <p className="text-[14px] text-gray-500">
            앱을 새로고침하면 대부분 해결돼요
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 rounded-full bg-accent px-6 py-3 text-[14px] font-semibold text-white active:opacity-70"
          >
            새로고침
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
