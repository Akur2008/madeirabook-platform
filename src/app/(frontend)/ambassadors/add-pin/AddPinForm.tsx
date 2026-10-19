'use client'

import React, { useEffect, useState } from 'react'

import PinLocationPicker from './PinLocationPicker'

const PHOTO_MAX_BYTES = 5 * 1024 * 1024
const VIDEO_MAX_BYTES = 30 * 1024 * 1024

const inputClass =
  'w-full rounded-md border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-[#d4af37]/60'

export default function AddPinForm({ token }: { token: string }) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('beach')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [video, setVideo] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  // Persist the invitation so the ambassador can return without the URL.
  useEffect(() => {
    document.cookie = `ambassador_token=${token}; path=/; max-age=31536000; samesite=lax`
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!title.trim()) return setError('Give your spot a title.')
    if (!coords) return setError('Tap the map to drop a pin.')
    if (photo && photo.size > PHOTO_MAX_BYTES)
      return setError('Photo is too large (max 5 MB).')
    if (video) {
      if (video.size > VIDEO_MAX_BYTES)
        return setError('Video is too large (max 30 MB).')
      if (!['video/mp4', 'video/quicktime'].includes(video.type))
        return setError('Video must be mp4 or mov.')
    }

    const form = new FormData()
    form.set('token', token)
    form.set('title', title.trim())
    form.set('category', category)
    form.set('lat', String(coords.lat))
    form.set('lng', String(coords.lng))
    if (description.trim()) form.set('description', description.trim())
    if (photo) form.set('photo', photo)
    if (video) form.set('video', video)

    setStatus('loading')
    try {
      const res = await fetch('/api/ambassador/pins', {
        method: 'POST',
        body: form,
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (res.ok && data.ok) {
        setStatus('done')
      } else {
        setStatus('error')
        setError(data.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setStatus('error')
      setError('Network error. Please try again.')
    }
  }

  if (status === 'done') {
    return (
      <div className="w-full rounded-lg border border-[#d4af37]/30 bg-[#d4af37]/10 p-6 text-center">
        <p className="text-lg font-semibold text-[#d4af37]">Spot received.</p>
        <p className="mt-2 text-sm text-white/60">
          Your spot is pending review. We&apos;ll approve within 24h.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-white/50">
          Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={60}
          required
          placeholder="Secret sunset spot"
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-white/50">
          Category *
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={inputClass}
        >
          <option value="beach">Beach</option>
          <option value="restaurant">Restaurant</option>
          <option value="viewpoint">Viewpoint</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-white/50">
          Location * — tap the map
        </label>
        <PinLocationPicker value={coords} onChange={setCoords} />
        <p className="mt-1.5 text-xs text-white/40">
          {coords
            ? `📍 ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
            : 'No pin yet — tap where your spot is.'}
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-white/50">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Why do you love it? Best time to visit?"
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-white/50">
          Photo — optional, max 5 MB
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          className="w-full text-sm text-white/60 file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:text-white hover:file:bg-white/20"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-white/50">
          Video — optional, max 30 MB, mp4/mov
        </label>
        <input
          type="file"
          accept="video/mp4,video/quicktime"
          onChange={(e) => setVideo(e.target.files?.[0] ?? null)}
          className="w-full text-sm text-white/60 file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:text-white hover:file:bg-white/20"
        />
      </div>

      {error && <p className="text-center text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full rounded-md bg-[#d4af37] px-4 py-4 text-sm font-semibold text-[#0a1420] transition-colors hover:bg-[#e5c04b] disabled:opacity-50"
      >
        {status === 'loading' ? 'Sending…' : 'Submit for review →'}
      </button>
    </form>
  )
}
