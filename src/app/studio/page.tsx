'use client'

import dynamic from 'next/dynamic'
import config from '../../../sanity.config'

// Tải chậm NextStudio chỉ khi Client gọi tới trang này
const NextStudioLazy = dynamic(
  () => import('next-sanity/studio').then((mod) => mod.NextStudio),
  {
    ssr: false, // Tắt Server-Side Rendering vì Studio chỉ chạy ở trình duyệt
    loading: () => (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'sans-serif',
        backgroundColor: '#13141a',
        color: '#fff'
      }}>
        <p>Đang tải trình quản lý Sanity Studio...</p>
      </div>
    )
  }
)

export default function StudioPage() {
  return <NextStudioLazy config={config} />
}