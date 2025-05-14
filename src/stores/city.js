// /stores/city.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCityStore = defineStore('city', () => {
  // Массив с городами, который будет доступен во всей аппликации
  const cities = ref([
    { id: 1, label: 'Москва', value: 'moscow', coords: [55.751244, 37.618423] },
    { id: 2, label: 'Санкт-Петербург', value: 'spb', coords: [59.9375, 30.3086]},
    { id: 3, label: 'Новосибирск', value: 'nsk', coords:  [55.0415, 82.9346]}
    // Можно добавить асинхронную подгрузку
  ])

  // Текущий выбранный город
  const selectedCity = ref(cities.value.find(city => city.value === 'moscow'))
  return { cities, selectedCity }
})
