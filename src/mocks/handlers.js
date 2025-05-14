import { http, HttpResponse } from 'msw'

const allLocations = [
  { id: 1, name: 'Парк Горького', city_id: 1, lat: 55.729876, lng: 37.603493, rating: 4.7 },
  { id: 2, name: 'ВДНХ', city_id: 1, lat: 55.829895, lng: 37.633266, rating: 4.6 },
  { id: 3, name: 'Елагин остров', city_id: 2, lat: 59.972218, lng: 30.217171, rating: 4.9 },
]

export const handlers = [
  http.get('/locations', ({ request }) => {
    const url = new URL(request.url)
    const cityIdParam = url.searchParams.get('city_id')
    const cityId = cityIdParam ? parseInt(cityIdParam) : null

    const filteredLocations = cityId
      ? allLocations.filter(loc => loc.city_id === cityId)
      : allLocations

    return HttpResponse.json(filteredLocations, { status: 200 })
  })
]
