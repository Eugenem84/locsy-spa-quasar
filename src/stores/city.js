// /stores/city.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from 'boot/axios'

export const useCityStore = defineStore('city', () => {
  const cities = ref([])
  const selectedCity = ref(null)
  // Идентификатор последнего запроса: защищает от гонок при быстром поиске
  let lastRequestId = 0

  function setSelectedCity(city) {
    selectedCity.value = city;
  }

  async function fetchCities(search = '') {
    const requestId = ++lastRequestId
    try {
      const { data } = await api.get('/api/cities', {
        params: { search }
      });

      // Устаревший ответ (пользователь уже ввёл другой запрос) игнорируем
      if (requestId !== lastRequestId) return

      cities.value = data.map(city => ({
        ...city,
        label: city.name,
        value: city.slug,
        // Координаты из API приходят строками (в БД DECIMAL), а ymaps3 ждёт числа.
        coords: [Number(city.latitude), Number(city.longitude)]
      }))
    } catch (error) {
      console.error('Error fetching cities:', error)
    }
  }

  return { cities, selectedCity, fetchCities, setSelectedCity }
})
