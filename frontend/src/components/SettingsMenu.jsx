/**
 * SettingsMenu - Customization menu for storage path and events.
 */
import { useState, useEffect } from 'react'
import { getSettings, updateSettings, listEvents, createEvent, changePassword } from '../api/settingsApi'
import { StoragePathPicker } from './StoragePathPicker'
import { EventImagePreview } from './EventImagePreview'
import { PasswordInput } from './PasswordInput'

export function SettingsMenu({ onClose, currentPassword = '' }) {
  const [mediaRoot, setMediaRoot] = useState('')
  const [defaultEventSlug, setDefaultEventSlug] = useState('')
  const [events, setEvents] = useState([])
  const [newEventName, setNewEventName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const [settings, eventsList] = await Promise.all([getSettings(), listEvents()])
      setMediaRoot(settings.media_root || '')
      setDefaultEventSlug(settings.default_event_slug || 'onlocation')
      setEvents(eventsList || [])
    } catch (e) {
      setMessage('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setMessage('')
    try {
      await updateSettings({
        media_root: mediaRoot || undefined,
        default_event_slug: defaultEventSlug || undefined,
      })
      setMessage('Settings saved')
    } catch (e) {
      setMessage('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword.trim()) {
      setPasswordMessage('New password is required')
      return
    }
    if (newPassword.length < 4) {
      setPasswordMessage('Password must be at least 4 characters')
      return
    }
    setPasswordMessage('')
    setSaving(true)
    try {
      await changePassword(currentPassword, newPassword)
      setPasswordMessage('Password changed')
      setNewPassword('')
    } catch (e) {
      setPasswordMessage(e.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateEvent() {
    if (!newEventName.trim()) return
    setSaving(true)
    setMessage('')
    try {
      const created = await createEvent(newEventName.trim())
      setEvents((prev) => [...prev, created])
      setNewEventName('')
      setDefaultEventSlug(created.slug)
      setMessage('Event created')
    } catch (e) {
      setMessage('Failed to create event')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content settings-menu" onClick={(e) => e.stopPropagation()}>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content settings-menu" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2 className="settings-title">Settings</h2>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <section className="settings-section">
          <h3 className="settings-section-title">Password</h3>
          <p className="settings-hint">Change the password used to access settings.</p>
          <PasswordInput
            value={currentPassword}
            placeholder="Current password"
            disabled
            readOnly
            autoComplete="current-password"
          />
          <PasswordInput
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            disabled={saving}
            autoComplete="new-password"
          />
          {passwordMessage && (
            <p className={passwordMessage === 'Password changed' ? 'settings-message' : 'preview-error'}>
              {passwordMessage}
            </p>
          )}
          <button
            type="button"
            className="btn-change-password"
            onClick={handleChangePassword}
            disabled={saving}
          >
            Change password
          </button>
        </section>

        <section className="settings-section">
          <h3 className="settings-section-title">Storage path</h3>
          <p className="settings-hint">Choose where photos are saved. Use Browse to pick a folder.</p>
          <StoragePathPicker
            value={mediaRoot}
            onChange={setMediaRoot}
            disabled={saving}
          />
        </section>

        <section className="settings-section">
          <h3 className="settings-section-title">Events</h3>
          <p className="settings-hint">Photos are organized by event. Select the active event.</p>
          <select
            value={defaultEventSlug}
            onChange={(e) => setDefaultEventSlug(e.target.value)}
            className="events-select"
            disabled={saving}
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.slug}>
                {ev.name} ({ev.slug})
              </option>
            ))}
          </select>
          <div className="create-event-row">
            <input
              type="text"
              value={newEventName}
              onChange={(e) => setNewEventName(e.target.value)}
              placeholder="New event name"
              className="settings-input"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateEvent()}
            />
            <button
              type="button"
              className="btn-create-event"
              onClick={handleCreateEvent}
              disabled={!newEventName.trim() || saving}
            >
              Create
            </button>
          </div>
          <div className="event-preview-section">
            <h3 className="settings-section-title">Photo preview</h3>
            <EventImagePreview eventSlug={defaultEventSlug} className="preview-in-settings" />
          </div>
        </section>

        {message && <p className="settings-message">{message}</p>}

        <div className="settings-actions">
          <button type="button" className="btn-modal-secondary" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="btn-modal-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
