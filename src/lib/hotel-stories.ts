// Shared "Hotel Stories" reel data for the homepage phone-frame section.
// hotelSlug is null while the hotel has no published page — the sheet then
// falls back to the concierge mailto CTA (same pattern as VideoBottomSheet).
export interface HotelStory {
  id: string
  title: string
  videoUrl: string // vertical 9:16 mp4
  posterUrl: string
  description: string
  hotelSlug: string | null
  brand: 'oasis' | 'book'
}

export const HOTEL_STORIES: HotelStory[] = [
  {
    id: 'savoy-palace',
    title: 'Savoy Palace',
    videoUrl: '/images/savoy-palace/video-unconditional-world.mp4',
    posterUrl: '/images/savoy-palace/video-unconditional-world-poster.webp',
    description: 'Funchal’s grand dame — rooftop pool over the harbour.',
    hotelSlug: null,
    brand: 'oasis',
  },
  {
    id: 'barcelo-funchal-oldtown',
    title: 'Barceló Funchal Oldtown',
    videoUrl: '/images/barcelo/video-worldwithasuitcase.mp4',
    posterUrl: '/images/barcelo/IMG_0165.webp',
    description: 'A design-led hideaway tucked into the old town.',
    hotelSlug: 'barcelo-funchal-oldtown',
    brand: 'oasis',
  },
]
