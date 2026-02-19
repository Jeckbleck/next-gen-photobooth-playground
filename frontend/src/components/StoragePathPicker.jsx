/**
 * StoragePathPicker - Picks storage path via browse button.
 */
import { useState } from 'react'
import { browseFolder } from '../api/settingsApi'

export function StoragePathPicker({ value, onChange, disabled }) {
  const [browsing, setBrowsing] = useState(false)
  const [browseError, setBrowseError] = useState(null)

  async function handleBrowse() {
    setBrowsing(true)
    setBrowseError(null)
    try {
      const { path } = await browseFolder()
      onChange(path)
    } catch (e) {
      setBrowseError('Browse not available — enter path manually')
    } finally {
      setBrowsing(false)
    }
  }

  return (
    <div className="storage-path-picker">
      <div className="storage-path-picker-row">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="./media"
        className="settings-input"
        disabled={disabled}
      />
      <button
        type="button"
        className="btn-browse"
        onClick={handleBrowse}
        disabled={disabled || browsing}
      >
        {browsing ? '...' : 'Browse'}
      </button>
      </div>
      {browseError && <p className="browse-error">{browseError}</p>}
    </div>
  )
}
