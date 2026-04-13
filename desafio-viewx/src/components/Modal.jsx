import React, { useEffect, useRef } from 'react'
import { X, Eye, Heart, MessageCircle, Calendar, ExternalLink } from 'lucide-react'

const formatNumber = n => {
  if (!n && n !== 0) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toString()
}

const formatDate = dateStr => {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

const Modal = ({ reel, onClose }) => {
  const overlayRef = useRef(null)

  useEffect(() => {
    const handleKey = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const handleOverlayClick = e => {
    if (e.target === overlayRef.current) onClose()
  }

  if (!reel) return null

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>

      <div style={{
        background: '#111118',
        border: '1px solid #2a2a38',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideUp 0.2s ease',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid #2a2a38',
        }}>
          <h3 style={{ color: '#f0f0f5', fontSize: '16px', fontWeight: '600' }}>
            Detalhes do Reel
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            {reel.url && (
              <a
                href={reel.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  background: '#18181f',
                  border: '1px solid #2a2a38',
                  borderRadius: '8px',
                  color: '#8888a0',
                  textDecoration: 'none',
                  transition: 'color 0.2s, border-color 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = '#e1306c'
                  e.currentTarget.style.borderColor = '#e1306c'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = '#8888a0'
                  e.currentTarget.style.borderColor = '#2a2a38'
                }}
              >
                <ExternalLink size={16} />
              </a>
            )}
            <button
              onClick={onClose}
              id="modal-close-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                background: '#18181f',
                border: '1px solid #2a2a38',
                borderRadius: '8px',
                color: '#8888a0',
                cursor: 'pointer',
                transition: 'color 0.2s, border-color 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#f0f0f5'
                e.currentTarget.style.borderColor = '#f0f0f5'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = '#8888a0'
                e.currentTarget.style.borderColor = '#2a2a38'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.2fr',
          flex: 1,
          overflow: 'hidden',
        }}>
          <div style={{
            background: '#0a0a0f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}>
            {reel.url ? (
              <iframe
                src={reel.platform === 'tiktok' 
                     ? `https://www.tiktok.com/embed/v2/${reel.url.split('/').filter(Boolean).pop()}`
                     : `https://www.instagram.com/p/${reel.url.split('/').filter(Boolean).pop()}/embed/`}
                title="Reel"
                frameBorder="0"
                scrolling="no"
                allowtransparency="true"
                allow="encrypted-media"
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: '500px',
                  borderRadius: '12px',
                }}
              />
            ) : reel.thumbnail ? (
              <img
                src={reel.thumbnail}
                alt="Reel"
                style={{
                  width: '100%',
                  maxHeight: '400px',
                  borderRadius: '12px',
                  objectFit: 'contain',
                }}
              />
            ) : (
              <div style={{
                width: '100%',
                paddingTop: '177%',
                background: '#18181f',
                borderRadius: '12px',
                position: 'relative',
              }}>
                <span style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#8888a0',
                  fontSize: '14px',
                }}>
                  Sem preview
                </span>
              </div>
            )}
          </div>

          <div style={{
            padding: '28px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ color: '#8888a0', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600' }}>
                Métricas
              </p>

              {[
                ...(reel.platform === 'tiktok' ? [
                  { icon: Eye, value: reel.views, label: 'Visualizações', color: '#3b9eff' }
                ] : [
                  { icon: Heart, value: reel.likes, label: 'Curtidas', color: '#e1306c' },
                  { icon: MessageCircle, value: reel.comments, label: 'Comentários', color: '#8888a0' }
                ])
              ].map(({ icon: Icon, value, label, color }) => (
                <div key={label} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#18181f',
                  border: '1px solid #2a2a38',
                  borderRadius: '12px',
                  padding: '14px 16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={18} color={color} />
                    <span style={{ color: '#8888a0', fontSize: '14px' }}>{label}</span>
                  </div>
                  <span style={{ color: '#f0f0f5', fontWeight: '700', fontSize: '16px' }}>
                    {formatNumber(value)}
                  </span>
                </div>
              ))}
            </div>

            {reel.platform !== 'tiktok' && (
              <div style={{
                background: '#18181f',
                border: '1px solid #2a2a38',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <Calendar size={18} color="#8888a0" />
                <div>
                  <p style={{ color: '#8888a0', fontSize: '12px' }}>Publicado em</p>
                  <p style={{ color: '#f0f0f5', fontSize: '14px', fontWeight: '500', marginTop: '2px' }}>
                    {formatDate(reel.date)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Modal
