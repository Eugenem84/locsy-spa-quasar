// /stores/city.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from 'boot/axios'

export const useCityStore = defineStore('city', () => {
  const cities = ref([])
  const selectedCity = ref(null)

  function setSelectedCity(city) {
    selectedCity.value = city;
  }

  async function fetchCities(search = '') {
    try {
      const { data } = await api.get('/api/cities', {
        params: { search }
      });
      cities.value = data.map(city => ({
        ...city,
        label: city.name,
        value: city.slug,
        coords: [city.latitude, city.longitude]
      }))
    } catch (error) {
      console.error('Error fetching cities:', error)
    }
  }

  return { cities, selectedCity, fetchCities, setSelectedCity }
})
