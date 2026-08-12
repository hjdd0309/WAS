import youtubeIcon from './assets/apps/youtube.png'
import instagramIcon from './assets/apps/instagram.png'
import kakaotalkIcon from './assets/apps/kakaotalk.png'

// 온보딩에서 고를 수 있는 모니터링 대상 앱 목록. 실제 스크린타임 연동 전까지는
// 데모용 고정 목록으로 둔다.
export const APPS = [
  { id: 'youtube', name: 'YouTube', icon: youtubeIcon },
  { id: 'instagram', name: 'Instagram', icon: instagramIcon },
  { id: 'kakaotalk', name: '카카오톡', icon: kakaotalkIcon },
]

export function getApp(id) {
  return APPS.find((a) => a.id === id) ?? APPS[0]
}
