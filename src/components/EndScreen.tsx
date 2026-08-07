export default function EndScreen({
  onBackToFeed,
  onShowLog,
}: {
  onBackToFeed: () => void;
  onShowLog: () => void;
}) {
  return (
    <div className="w-full h-full bg-gradient-to-b from-neutral-900 to-black text-white flex flex-col items-center justify-center px-8 text-center">
      <span className="text-4xl mb-4">👋</span>
      <h1 className="text-xl font-semibold mb-2">통화가 끝났어요</h1>
      <p className="text-sm text-neutral-400 mb-10">
        이제 뭘 할지는 당신의 선택이에요.
      </p>

      <button
        onClick={onBackToFeed}
        className="w-full py-4 rounded-full bg-purple-600 font-medium mb-3"
      >
        피드로 돌아가기
      </button>
      <button
        onClick={onShowLog}
        className="w-full py-3 rounded-full bg-transparent border border-neutral-700 text-neutral-300 text-sm"
      >
        이 전화, 왜 왔는지 보기
      </button>
    </div>
  );
}
