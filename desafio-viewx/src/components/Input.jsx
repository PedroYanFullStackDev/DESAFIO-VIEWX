import React from 'react'

const Input = ({ value, onChange, onKeyDown, placeholder, id, disabled }) => {
  return (
    <input
      id={id}
      type="text"
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      autoComplete="off"
      spellCheck="false"
      style={{
        background: '#18181f',
        border: '1px solid #2a2a38',
        borderRadius: '12px',
        color: '#f0f0f5',
        fontSize: '16px',
        padding: '14px 20px',
        width: '100%',
        outline: 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        fontFamily: 'inherit',
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
  )
}

export default Input
