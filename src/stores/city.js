// /stores/city.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from 'boot/axios'

export const useCityStore = defineStore('city', () => {
  const cities = ref([])
  const selectedCity = ref(null)

  async function fetchCities() {
    try {
      const { data } = await api.get('/api/cities')
      cities.value = data.map(city => ({
        id: city.id,
        label: city.name,
        value: city.slug,
        coords: [city.latitude, city.longitude]
      }))
      if (cities.value.length > 0) {
        selectedCity.value = cities.value[0]
      }
    } catch (error) {
      console.error('Error fetching cities:', error)
    }
  }

  return { cities, selectedCity, fetchCities }
})
