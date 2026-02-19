/**
 * PasswordModal - Password prompt for accessing settings.
 */
import { useState, useRef, useEffect } from 'react'
import { verifyPassword } from '../api/settingsApi'
import { PasswordInput } from './PasswordInput'

export function PasswordModal({ onSuccess, onCancel }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const valid = await verifyPassword(password)
      if (valid) {
        onSuccess(password)
      } else {
        setError('Incorrect password')
        setPassword('')
      }
    } catch (err) {
      setError('Could not verify password')
      setPassword('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content password-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Enter password</h3>
        <form onSubmit={handleSubmit}>
          <PasswordInput
            ref={inputRef}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            disabled={loading}
            autoComplete="off"
            className="password-modal-input"
          />
          {error && <p className="modal-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn-modal-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn-modal-primary" disabled={loading}>
              {loading ? 'Checking…' : 'Enter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
