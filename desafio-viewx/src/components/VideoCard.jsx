import React from 'react'
import { Eye, Heart } from 'lucide-react'

const formatNumber = n => {
  if (!n && n !== 0) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toString()
}

const VideoCard = ({ reel, onClick }) => {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
      style={{
        background: '#18181f',
        border: '1px solid #2a2a38',
        borderRadius: '16px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
        position: 'relative',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.borderColor = '#FF6B4A'
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(255,107,74,0.2)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.borderColor = '#2a2a38'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div style={{ position: 'relative', paddingTop: '177.77%' }}>
        <img
          src={reel.thumbnail || undefined}
          alt="Reel thumbnail"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          onError={e => {
            e.target.style.background = '#18181f'
            e.target.style.display = 'none'
          }}
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          color: '#fff',
          fontSize: '13px',
          fontWeight: '600',
          textShadow: '0 1px 4px rgba(0,0,0,0.8)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Eye size={14} color="#fff" />
            <span>{formatNumber(reel.views)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Heart size={14} color="#fff" />
            <span>{formatNumber(reel.likes)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoCard
