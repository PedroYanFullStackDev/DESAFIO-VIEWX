import React from 'react'
import { BadgeCheck, Eye, Heart, MessageCircle } from 'lucide-react'

const formatNumber = n => {
  if (!n && n !== 0) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toString()
}

const MetricBadge = ({ icon: Icon, value, color, label }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#18181f',
    border: '1px solid #2a2a38',
    borderRadius: '12px',
    padding: '12px 20px',
  }}>
    <Icon size={18} color={color} />
    <div>
      <p style={{ color: '#f0f0f5', fontSize: '18px', fontWeight: '700', lineHeight: 1 }}>
        {formatNumber(value)}
      </p>
      <p style={{ color: '#8888a0', fontSize: '11px', marginTop: '2px' }}>{label}</p>
    </div>
  </div>
)

const ProfileHeader = ({ data }) => {
  const reels = data?.reels || []

  const totalViews = reels.reduce((acc, r) => acc + (r.views || 0), 0)
  const totalLikes = reels.reduce((acc, r) => acc + (r.likes || 0), 0)
  const totalComments = reels.reduce((acc, r) => acc + (r.comments || 0), 0)

  return (
    <div style={{
      background: '#111118',
      border: '1px solid #2a2a38',
      borderRadius: '20px',
      padding: '28px 32px',
      marginBottom: '32px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img
            src={data.profile_pic_url || `https://ui-avatars.com/api/?name=${data.username}&background=e1306c&color=fff&size=80`}
            alt={data.username}
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '30%',
              objectFit: 'cover',
              border: '3px solid #e1306c',
            }}
            onError={e => {
              e.target.src = `https://ui-avatars.com/api/?name=${data.username}&background=e1306c&color=fff&size=80`
            }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#f0f0f5' }}>
              @{data.username}
            </h2>
            {data.is_verified && (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#3b9eff"/>
                <path d="M10 17l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#fff"/>
              </svg>
            )}
          </div>
          {data.full_name && (
            <p style={{ color: '#8888a0', fontSize: '14px', marginTop: '4px' }}>{data.full_name}</p>
          )}
          <p style={{ color: '#8888a0', fontSize: '13px', marginTop: '4px' }}>
            {reels.length} reels encontrados
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <MetricBadge icon={Eye} value={totalViews} color="#3b9eff" label="Total de Views" />
        {data.platform === 'instagram' && (
          <>
            <MetricBadge icon={Heart} value={totalLikes} color="#e1306c" label="Total de Likes" />
            <MetricBadge icon={MessageCircle} value={totalComments} color="#8888a0" label="Total de Comentários" />
          </>
        )}
      </div>
    </div>
  )
}

export default ProfileHeader
