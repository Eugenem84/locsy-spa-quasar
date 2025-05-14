import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/locations', () => {
    // Возвращаем готовый JSON-ответ — всё на уровне Fetch API
    return HttpResponse.json([
      { id: 1, name: 'Парк Горького', lat: 55.729876, lng: 37.603493, rating: 4.7 },
      { id: 2, name: 'ВДНХ',       lat: 55.829895, lng: 37.633266, rating: 4.6 }
    ], { status: 200 })
  })
]
