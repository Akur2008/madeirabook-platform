'use client'

import dynamic from 'next/dynamic'

const PropertyMap = dynamic(() => import('./PropertyMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] rounded-xl bg-[#0f1d2e] animate-pulse flex items-center justify-center text-white/40">
      Loading map...
    </div>
  ),
})

interface PropertyMapLoaderProps {
  latitude: number
  longitude: number
  title: string
  imageUrl?: string
  endLatitude?: number
  endLongitude?: number
  endTitle?: string
}

export default function PropertyMapLoader(props: PropertyMapLoaderProps) {
  return <PropertyMap {...props} />
}
