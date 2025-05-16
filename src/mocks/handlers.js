import { http, HttpResponse } from 'msw'

const allLocations = [
  { id: 1,
    name: 'Парк Горького',
    city_id: 1,
    lat: 55.729876,
    lng: 37.603493,
    rating: 4.7,
    description: 'Большой парк в центре Москвы с набережной, прокатом велосипедов и культурными мероприятиями.'
  },
  { id: 2,
    name: 'ВДНХ',
    city_id: 1,
    lat: 55.829895,
    lng: 37.633266,
    rating: 4.6,
    description: 'Выставочный комплекс с павильонами, фонтанами, парками и музеями.'
  },
  { id: 3,
    name: 'Елагин остров',
    city_id: 2,
    lat: 59.972218,
    lng: 30.217171,
    rating: 4.9,
    description: 'Зелёный остров в Петербурге с дворцом, мостами и тихими прогулочными маршрутами.'
  },
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
  }),

  http.get('/location/:id', ({ params }) => {
    const id = parseInt(params.id)
    const location = allLocations.find(location => location.id === id)

    if (!location){
      return HttpResponse.json({ message: 'Location not found' }, {status: 404})
    }
    //console.log('location: ', location)

    return HttpResponse.json(location, {status: 200})
  })

]
