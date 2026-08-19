import instaPostPhoto from '../../assets/mock/insta-post-photo.jpg'
import postOutdoor from '../../assets/mock/post-outdoor.jpg'
import postCafe from '../../assets/mock/post-cafe.jpg'
import avatar1 from '../../assets/mock/avatar-1.jpg'
import avatar2 from '../../assets/mock/avatar-2.jpg'
import avatar3 from '../../assets/mock/avatar-3.jpg'
import avatar4 from '../../assets/mock/avatar-4.jpg'
import avatar5 from '../../assets/mock/avatar-5.jpg'
import avatar6 from '../../assets/mock/avatar-6.jpg'
import avatar7 from '../../assets/mock/avatar-7.jpg'

// 실제 기기의 상태바/노치/홈 인디케이터는 이미 화면에 떠 있으므로 여기서는
// 그 아래 콘텐츠 영역만 그린다 — 데모 체험용 가짜 인스타그램 화면.
const STORIES = [
  { username: 'user1102.official', avatar: avatar1, ring: 'linear-gradient(45deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5)' },
  { username: 'suuuzzi_', avatar: avatar2, ring: 'linear-gradient(45deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5)' },
  { username: 'Jonny2041', avatar: avatar3, ring: 'linear-gradient(45deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5)' },
  { username: 'j.ehinn', avatar: avatar4, ring: '#dbdbdb' },
]

const POSTS = [
  {
    username: 'hyeinantwerp',
    timeAgo: '36분 전',
    avatar: avatar5,
    photo: instaPostPhoto,
    likeCount: '좋아요 1,204개',
    caption: '오늘도 작업실에서 하루 시작 🧵',
    commentCount: '댓글 32개 모두 보기',
  },
  {
    username: 'zi.0one',
    timeAgo: '2시간 전',
    avatar: avatar6,
    photo: postOutdoor,
    likeCount: '좋아요 856개',
    caption: '주말 나들이 🌤️ 날씨 미쳤다',
    commentCount: '댓글 14개 모두 보기',
  },
  {
    username: 'kaeei.h',
    timeAgo: '5시간 전',
    avatar: avatar7,
    photo: postCafe,
    likeCount: '좋아요 2,391개',
    caption: '새 카페 오픈했어요, 놀러오세요 ☕️',
    commentCount: '댓글 58개 모두 보기',
  },
]

function StoryAvatar({ username, avatar, ring }) {
  return (
    <div className="flex w-[64px] shrink-0 flex-col items-center gap-1">
      <div
        className="flex size-[58px] items-center justify-center rounded-full p-[2.5px]"
        style={{ background: ring }}
      >
        <img src={avatar} alt="" className="size-full rounded-full border-[2.5px] border-white object-cover" />
      </div>
      <p className="w-full truncate text-center text-[10.5px] leading-tight text-[#262626]">{username}</p>
    </div>
  )
}

function Post({ username, timeAgo, avatar, photo, likeCount, caption, commentCount }) {
  return (
    <div className="border-b border-[#efefef]">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <img src={avatar} alt="" className="size-8 shrink-0 rounded-full object-cover" />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold leading-tight text-[#262626]">{username}</p>
            <p className="text-[11px] leading-tight text-[#8e8e8e]">{timeAgo}</p>
          </div>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#262626">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </div>

      <div className="aspect-[4/5] w-full overflow-hidden bg-black">
        <img src={photo} alt="" className="h-full w-full object-cover" />
      </div>

      <div className="px-3.5 pb-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20 3.5 11.5a5.5 5.5 0 1 1 8.5-6.9 5.5 5.5 0 1 1 8.5 6.9Z" />
            </svg>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 22 4.7 15.6A9 9 0 1 1 9 20.3Z" />
            </svg>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="1.5" strokeLinejoin="round">
              <path d="M22 2 11 13" />
              <path d="M22 2 15 22l-4-9-9-4Z" />
            </svg>
          </div>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3h12v18l-6-4.5L6 21Z" />
          </svg>
        </div>
        <p className="mt-1.5 text-[13px] font-semibold text-[#262626]">{likeCount}</p>
        <p className="mt-0.5 truncate text-[13px] text-[#262626]">
          <span className="font-semibold">{username}</span> {caption}
        </p>
        <p className="mt-0.5 text-[12px] text-[#8e8e8e]">{commentCount}</p>
      </div>
    </div>
  )
}

export default function InstaMockScreen() {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white">
      <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-3">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <p className="font-insta-logo text-[32px] leading-none text-black">Instagram</p>
        <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
        </svg>
      </div>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
        <div className="no-scrollbar flex gap-2.5 overflow-x-auto border-b border-[#efefef] px-4 pb-2.5 pt-1">
          {STORIES.map((s) => (
            <StoryAvatar key={s.username} username={s.username} avatar={s.avatar} ring={s.ring} />
          ))}
        </div>

        {POSTS.map((post) => (
          <Post key={post.username} {...post} />
        ))}
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-[#efefef] px-6 pb-3 pt-2.5">
        <svg width="25" height="25" viewBox="0 0 24 24" fill="#262626">
          <path d="M12 3 3 10.5V21h6v-6h6v6h6V10.5L12 3Z" />
        </svg>
        <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="16" rx="4" />
          <path d="M10 9.5v5l4.5-2.5Z" fill="#262626" stroke="none" />
        </svg>
        <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
          <path d="M12 8v8M8 12h8" />
        </svg>
        <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <img src={avatar1} alt="" className="size-[25px] shrink-0 rounded-full object-cover" />
      </div>
    </div>
  )
}
