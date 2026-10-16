'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export interface FormOption {
  id: number
  name: string
  icon?: string | null
}

export interface PropertyFormInitial {
  title: string
  slug: string
  description: string
  shortDescription: string
  pricePerNight: string
  cleaningFee: string
  sizeM2: string
  bedrooms: string
  bathrooms: string
  maxGuests: string
  checkInTime: string
  checkOutTime: string
  location: string
  pmsPropertyId: string
  isVerified: boolean
  status: string
  amenities: number[]
  houseRules: number[]
}

const CREATE_DEFAULTS: PropertyFormInitial = {
  title: '',
  slug: '',
  description: '',
  shortDescription: '',
  pricePerNight: '',
  cleaningFee: '0',
  sizeM2: '',
  bedrooms: '1',
  bathrooms: '1',
  maxGuests: '2',
  checkInTime: '15:00',
  checkOutTime: '11:00',
  location: '',
  pmsPropertyId: '',
  isVerified: false,
  status: 'draft',
  amenities: [],
  houseRules: [],
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

function numOrNull(v: string): number | null {
  if (v.trim() === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

const INPUT =
  'w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-emerald-400/60'
const LABEL = 'mb-1 block text-xs uppercase tracking-wide text-white/50'

function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div>
      <label className={LABEL}>{label}</label>
      {children}
      {hint ? <p className="mt-1 text-xs text-white/35">{hint}</p> : null}
    </div>
  )
}

export default function PropertyForm({
  mode,
  propertyId,
  initial,
  amenities,
  houseRules,
  locations,
}: {
  mode: 'create' | 'edit'
  propertyId?: number
  initial?: Partial<PropertyFormInitial>
  amenities: FormOption[]
  houseRules: FormOption[]
  locations: FormOption[]
}) {
  const router = useRouter()
  const [form, setForm] = useState<PropertyFormInitial>({
    ...CREATE_DEFAULTS,
    ...initial,
  })
  const [slugTouched, setSlugTouched] = useState(mode === 'edit')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof PropertyFormInitial>(
    key: K,
    value: PropertyFormInitial[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function toggleId(key: 'amenities' | 'houseRules', id: number) {
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(id)
        ? f[key].filter((x) => x !== id)
        : [...f[key], id],
    }))
  }

  function onTitleChange(value: string) {
    setForm((f) => ({
      ...f,
      title: value,
      slug: slugTouched ? f.slug : slugify(value),
    }))
  }

  function onSlugChange(value: string) {
    setSlugTouched(true)
    set('slug', slugify(value))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)

    const body = {
      title: form.title,
      slug: form.slug,
      description: form.description,
      shortDescription: form.shortDescription,
      pricePerNight: numOrNull(form.pricePerNight),
      cleaningFee: numOrNull(form.cleaningFee),
      sizeM2: numOrNull(form.sizeM2),
      bedrooms: numOrNull(form.bedrooms),
      bathrooms: numOrNull(form.bathrooms),
      maxGuests: numOrNull(form.maxGuests),
      checkInTime: form.checkInTime,
      checkOutTime: form.checkOutTime,
      location: form.location ? Number(form.location) : null,
      amenities: form.amenities,
      houseRules: form.houseRules,
      pmsPropertyId: form.pmsPropertyId,
      isVerified: form.isVerified,
      status: form.status,
    }

    try {
      const res = await fetch(
        mode === 'create'
          ? '/api/owner/properties'
          : `/api/owner/properties/${propertyId}`,
        {
          method: mode === 'create' ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      )
      const data = (await res.json().catch(() => null)) as {
        error?: string
      } | null
      if (!res.ok) {
        setError(data?.error || 'Save failed')
        setBusy(false)
        return
      }
      router.push('/owner/properties')
      router.refresh()
    } catch {
      setError('Save failed')
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6"
    >
      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <Field label="Title *">
        <input
          type="text"
          required
          maxLength={120}
          value={form.title}
          onChange={(e) => onTitleChange(e.target.value)}
          className={INPUT}
        />
      </Field>

      <Field label="Slug *" hint="Used in the public URL: /p/slug">
        <input
          type="text"
          required
          maxLength={80}
          value={form.slug}
          onChange={(e) => onSlugChange(e.target.value)}
          className={`${INPUT} font-mono`}
        />
      </Field>

      <Field label="Description">
        <textarea
          rows={5}
          maxLength={4000}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          className={INPUT}
        />
      </Field>

      <Field
        label="Short description"
        hint="Up to 300 characters, shown on the card"
      >
        <textarea
          rows={2}
          maxLength={300}
          value={form.shortDescription}
          onChange={(e) => set('shortDescription', e.target.value)}
          className={INPUT}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Price per night (EUR) *">
          <input
            type="number"
            required
            min={0}
            step={1}
            value={form.pricePerNight}
            onChange={(e) => set('pricePerNight', e.target.value)}
            className={INPUT}
          />
        </Field>
        <Field label="Cleaning fee (EUR)">
          <input
            type="number"
            min={0}
            step={1}
            value={form.cleaningFee}
            onChange={(e) => set('cleaningFee', e.target.value)}
            className={INPUT}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="m²">
          <input
            type="number"
            min={1}
            step={1}
            value={form.sizeM2}
            onChange={(e) => set('sizeM2', e.target.value)}
            className={INPUT}
          />
        </Field>
        <Field label="Bedrooms">
          <input
            type="number"
            min={0}
            step={1}
            value={form.bedrooms}
            onChange={(e) => set('bedrooms', e.target.value)}
            className={INPUT}
          />
        </Field>
        <Field label="Bathrooms">
          <input
            type="number"
            min={0}
            step={1}
            value={form.bathrooms}
            onChange={(e) => set('bathrooms', e.target.value)}
            className={INPUT}
          />
        </Field>
        <Field label="Max guests">
          <input
            type="number"
            min={1}
            step={1}
            value={form.maxGuests}
            onChange={(e) => set('maxGuests', e.target.value)}
            className={INPUT}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Check-in time">
          <input
            type="text"
            value={form.checkInTime}
            onChange={(e) => set('checkInTime', e.target.value)}
            className={INPUT}
          />
        </Field>
        <Field label="Check-out time">
          <input
            type="text"
            value={form.checkOutTime}
            onChange={(e) => set('checkOutTime', e.target.value)}
            className={INPUT}
          />
        </Field>
      </div>

      <Field label="Location">
        <select
          value={form.location}
          onChange={(e) => set('location', e.target.value)}
          className={INPUT}
        >
          <option value="">— Not set —</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </Field>

      {amenities.length > 0 ? (
        <Field label="Amenities">
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {amenities.map((a) => (
              <label
                key={a.id}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm text-white/80 hover:bg-white/5"
              >
                <input
                  type="checkbox"
                  checked={form.amenities.includes(a.id)}
                  onChange={() => toggleId('amenities', a.id)}
                  className="accent-emerald-500"
                />
                <span>
                  {a.icon ? `${a.icon} ` : ''}
                  {a.name}
                </span>
              </label>
            ))}
          </div>
        </Field>
      ) : null}

      {houseRules.length > 0 ? (
        <Field label="House rules">
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {houseRules.map((r) => (
              <label
                key={r.id}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm text-white/80 hover:bg-white/5"
              >
                <input
                  type="checkbox"
                  checked={form.houseRules.includes(r.id)}
                  onChange={() => toggleId('houseRules', r.id)}
                  className="accent-emerald-500"
                />
                <span>{r.name}</span>
              </label>
            ))}
          </div>
        </Field>
      ) : null}

      <Field
        label="PMS property ID (optional)"
        hint="If empty, booking stays unavailable until PMS is connected"
      >
        <input
          type="text"
          maxLength={80}
          value={form.pmsPropertyId}
          onChange={(e) => set('pmsPropertyId', e.target.value)}
          className={INPUT}
        />
      </Field>

      {mode === 'edit' ? (
        <Field label="Status">
          <select
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
            className={INPUT}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </Field>
      ) : null}

      <label className="flex cursor-pointer items-center gap-2 text-sm text-white/80">
        <input
          type="checkbox"
          checked={form.isVerified}
          onChange={(e) => set('isVerified', e.target.checked)}
          className="accent-emerald-500"
        />
        <span>Verified</span>
      </label>

      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
        >
          {busy
            ? 'Saving…'
            : mode === 'create'
              ? 'Create property'
              : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/owner/properties')}
          className="rounded-lg border border-white/15 px-4 py-2.5 text-sm text-white/70 transition-colors hover:border-white/40 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
