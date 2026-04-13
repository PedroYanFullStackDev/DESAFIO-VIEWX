import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Loader2, AlertCircle } from 'lucide-react'
import { fetchReels } from '../services/api'
import Input from '../components/Input'
import ProfileHeader from '../components/ProfileHeader'
import VideoCard from '../components/VideoCard'
import Modal from '../components/Modal'

const InstagramIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
)

const TikTokIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.27 8.27 0 004.84 1.56V6.79a4.85 4.85 0 01-1.07-.1z"/>
  </svg>
)

const SocialButton = ({ platform, active, onClick, disabled }) => {
  const config = {
    instagram: { icon: <InstagramIcon />, label: 'Instagram', color: '#e1306c', id: 'btn-instagram' },
    tiktok: { icon: <TikTokIcon />, label: 'TikTok', color: '#69c9d0', id: 'btn-tiktok' },
  }
  const { icon, color, id } = config[platform]

  return (
    <button
      id={id}
      onClick={onClick}
      disabled={disabled}
      title={`Buscar no ${config[platform].label}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '52px',
        height: '52px',
        background: active ? color : '#18181f',
        border: `1px solid ${active ? color : '#2a2a38'}`,
        borderRadius: '12px',
        color: active ? '#fff' : color,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        flexShrink: 0,
        opacity: disabled ? 0.6 : 1,
      }}
      onMouseEnter={e => {
        if (!disabled && !active) {
          e.currentTarget.style.background = `${color}22`
          e.currentTarget.style.borderColor = color
        }
      }}
      onMouseLeave={e => {
        if (!disabled && !active) {
          e.currentTarget.style.background = '#18181f'
          e.currentTarget.style.borderColor = '#2a2a38'
        }
      }}
    >
      {icon}
    </button>
  )
}

const Home = () => {
  const [username, setUsername] = useState('')
  const [searchState, setSearchState] = useState(null)
  const [selectedReel, setSelectedReel] = useState(null)

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ['reels', searchState?.username, searchState?.platform],
    queryFn: () => fetchReels(searchState.username, searchState.platform),
    enabled: !!searchState,
    retry: 0,
  })

  const handleSearch = platform => {
    const clean = username.trim().replace(/^@/, '')
    if (!clean) return
    setSearchState({ username: clean, platform })
    setSelectedReel(null)
  }

  const handleKeyDown = e => {
    if (e.key === 'Enter') handleSearch('instagram')
  }

  const reels = data?.reels || []

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ textAlign: 'left', marginBottom: '48px' }}>
          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 48px)',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #FF6B4A 0%, #ff8c69 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '12px',
            letterSpacing: '-0.02em',
          }}>
            Viewx Analytics
          </h1>
          <p style={{ color: '#8888a0', fontSize: '16px' }}>
            Visualize métricas dos reels de qualquer perfil público
          </p>
        </div>

        <div style={{
          background: '#111118',
          border: '1px solid #2a2a38',
          borderRadius: '20px',
          padding: '28px',
          marginBottom: '40px',
        }}>
          <label
            htmlFor="username-input"
            style={{
              display: 'block',
              color: '#8888a0',
              fontSize: '13px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '12px',
            }}
          >
            Pesquisar influencer
          </label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#8888a0',
                pointerEvents: 'none',
                zIndex: 1,
              }}>
                <Search size={18} />
              </span>
              <div style={{ paddingLeft: '4px' }}>
                <input
                  id="username-input"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite o @user"
                  disabled={isFetching}
                  autoComplete="off"
                  spellCheck="false"
                  style={{
                    background: '#18181f',
                    border: '1px solid #2a2a38',
                    borderRadius: '12px',
                    color: '#f0f0f5',
                    fontSize: '16px',
                    padding: '14px 20px 14px 44px',
                    width: '100%',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#FF6B4A'
                    e.target.style.boxShadow = '0 0 0 3px rgba(255,107,74,0.15)'
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = '#2a2a38'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>
            </div>

            <SocialButton
              platform="instagram"
              active={searchState?.platform === 'instagram' && !!data}
              onClick={() => handleSearch('instagram')}
              disabled={isFetching || !username.trim()}
            />
            <SocialButton
              platform="tiktok"
              active={searchState?.platform === 'tiktok' && !!data}
              onClick={() => handleSearch('tiktok')}
              disabled={isFetching || !username.trim()}
            />
          </div>
        </div>

        {isFetching && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            padding: '80px 20px',
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              border: '3px solid #2a2a38',
              borderTopColor: '#e1306c',
              animation: 'spin 0.8s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <p style={{ color: '#8888a0', fontSize: '15px' }}>
              Coletando dados de <strong style={{ color: '#f0f0f5' }}>@{searchState?.username}</strong>...
            </p>
            <p style={{ color: '#8888a0', fontSize: '13px' }}>Isso pode levar até 30 segundos</p>
          </div>
        )}

        {!isFetching && error && (
          <div style={{
            background: error?.response?.status === 403 ? 'rgba(255,107,74,0.08)' : 'rgba(255,107,74,0.08)',
            border: `1px solid ${error?.response?.status === 403 ? '#FF6B4A' : 'rgba(255,107,74,0.3)'}`,
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <AlertCircle size={22} color="#FF6B4A" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <p style={{ color: '#f0f0f5', fontWeight: '600', marginBottom: '4px' }}>
                  {error?.response?.status === 403 ? 'Instagram Bloqueou o Acesso' : 'Falha ao buscar dados'}
                </p>
                <p style={{ color: '#8888a0', fontSize: '14px', lineHeight: '1.5' }}>
                  {error?.response?.data?.error || 'Erro inesperado ao conectar com o Instagram.'}
                </p>
              </div>
            </div>

            {error?.response?.status === 403 && (
              <div style={{
                background: '#18181f',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid #2a2a38'
              }}>
                <p style={{ color: '#f0f0f5', fontSize: '13px', fontWeight: '600', marginBottom: '10px' }}>
                  Como resolver (Passo a passo):
                </p>
                <ol style={{ color: '#8888a0', fontSize: '13px', paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <li>Acesse o <strong>Instagram.com</strong> no seu navegador e faça login.</li>
                  <li>Pressione <strong>F12</strong>, vá em <strong>Application (Aplicativo)</strong> &gt; <strong>Cookies</strong>.</li>
                  <li>Copie o valor do cookie <strong>sessionid</strong>.</li>
                  <li>Cole no arquivo <strong>backend/.env</strong> na linha <strong>IG_SESSION_ID=</strong>.</li>
                  <li>Reinicie o servidor backend.</li>
                </ol>
              </div>
            )}
          </div>
        )}

        {!isFetching && data && (
          <>
            <ProfileHeader data={{ ...data, username: searchState?.username }} />

            {reels.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#8888a0',
              }}>
                <p style={{ fontSize: '18px', marginBottom: '8px' }}>Nenhum reel encontrado</p>
                <p style={{ fontSize: '14px' }}>O perfil pode não ter reels públicos</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '16px',
              }}>
                {reels.map((reel, i) => (
                  <VideoCard
                    key={reel.url || i}
                    reel={reel}
                    onClick={() => setSelectedReel(reel)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {!isFetching && !data && !error && (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            color: '#8888a0',
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '30%',
              background: 'rgba(255,107,74,0.08)',
              border: '1px solid rgba(255,107,74,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <Search size={32} color="#FF6B4A" />
            </div>
            <p style={{ fontSize: '18px', color: '#f0f0f5', marginBottom: '8px' }}>
              Pronto para analisar
            </p>
            <p style={{ fontSize: '14px' }}>
              Digite um username e clique em Instagram ou TikTok
            </p>
          </div>
        )}
      </div>

      {selectedReel && (
        <Modal reel={selectedReel} onClose={() => setSelectedReel(null)} />
      )}
    </div>
  )
}

export default Home
