import { useCallback, useRef, useState } from "react";

const SWIPE_TRIGGER_THRESHOLD = 5;

interface Card {
  emoji: string;
  gradient: string;
  caption: string;
  tag: string;
}

const CARDS: Card[] = [
  { emoji: "🐶", gradient: "from-orange-400 to-pink-500", caption: "강아지가 사람처럼 앉아있는 영상", tag: "#웃긴동물" },
  { emoji: "🍜", gradient: "from-amber-400 to-red-500", caption: "3분 만에 끝내는 초간단 라면 레시피", tag: "#자취요리" },
  { emoji: "💃", gradient: "from-fuchsia-500 to-indigo-500", caption: "요즘 유행하는 챌린지 댄스", tag: "#챌린지" },
  { emoji: "🎮", gradient: "from-emerald-400 to-teal-600", caption: "1초 만에 클리어하는 게임 꿀팁", tag: "#게임" },
  { emoji: "😂", gradient: "from-sky-400 to-blue-600", caption: "말 안 통하는 신입사원 짤", tag: "#직장인공감" },
  { emoji: "🐱", gradient: "from-purple-400 to-violet-600", caption: "고양이가 물을 무서워하는 이유", tag: "#고양이" },
  { emoji: "🏀", gradient: "from-lime-400 to-green-600", caption: "역대급 버저비터 모음", tag: "#스포츠" },
  { emoji: "🍰", gradient: "from-pink-400 to-rose-600", caption: "무설탕 디저트 만들기", tag: "#디저트" },
];

export default function FeedScreen({ onTrigger }: { onTrigger: (swipeCount: number) => void }) {
  const [index, setIndex] = useState(0);
  const [dragY, setDragY] = useState(0);
  const swipeCountRef = useRef(0);
  const startYRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const triggeredRef = useRef(false);

  const registerSwipe = useCallback(() => {
    swipeCountRef.current += 1;
    if (!triggeredRef.current && swipeCountRef.current >= SWIPE_TRIGGER_THRESHOLD) {
      triggeredRef.current = true;
      onTrigger(swipeCountRef.current);
    }
  }, [onTrigger]);

  const advance = useCallback(() => {
    setIndex((i) => (i + 1) % CARDS.length);
    registerSwipe();
  }, [registerSwipe]);

  const onPointerDown = (e: React.PointerEvent) => {
    startYRef.current = e.clientY;
    draggingRef.current = true;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current || startYRef.current === null) return;
    setDragY(e.clientY - startYRef.current);
  };
  const onPointerUp = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (dragY < -60) {
      advance();
    }
    setDragY(0);
    startYRef.current = null;
  };

  const card = CARDS[index];

  return (
    <div className="w-full h-full bg-black relative select-none">
      <div
        className="absolute inset-0"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div
          className={`w-full h-full bg-gradient-to-br ${card.gradient} flex flex-col items-center justify-center transition-transform duration-150`}
          style={{ transform: `translateY(${dragY * 0.3}px)` }}
        >
          <span className="text-7xl mb-6">{card.emoji}</span>
          <p className="text-white text-lg font-semibold px-10 text-center">{card.caption}</p>
          <p className="text-white/70 text-sm mt-2">{card.tag}</p>
        </div>
      </div>

      <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-4 pointer-events-none">
        <span className="text-white text-sm font-medium bg-black/30 px-3 py-1 rounded-full">
          For You
        </span>
        <span className="text-white text-xs bg-black/30 px-3 py-1 rounded-full">
          swipe {swipeCountRef.current}
        </span>
      </div>

      <button
        onClick={advance}
        className="absolute right-4 bottom-28 w-11 h-11 rounded-full bg-white/15 backdrop-blur text-white flex items-center justify-center text-xl"
        aria-label="다음 콘텐츠"
      >
        ↑
      </button>

      <button
        onClick={() => {
          triggeredRef.current = true;
          onTrigger(SWIPE_TRIGGER_THRESHOLD);
        }}
        className="absolute left-4 bottom-6 text-[11px] text-white/60 bg-white/10 px-3 py-1.5 rounded-full"
      >
        ⏩ 데모: 바로 전화 걸기
      </button>

      <p className="absolute bottom-6 right-4 text-[11px] text-white/40">
        위로 스와이프해서 넘기기
      </p>
    </div>
  );
}
