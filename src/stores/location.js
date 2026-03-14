// /stores/location.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from 'boot/axios';

export const useLocationStore = defineStore('location', () => {
  const locations = ref([]);
  const selectedLocation = ref(null);

  async function fetchLocations(cityId) {
    if (!cityId) {
      locations.value = [];
      return;
    }
    try {
      const { data } = await api.get('/api/locations', {
        params: { city_id: cityId },
      });
      locations.value = data;
    } catch (error) {
      console.error('Error fetching locations:', error);
      locations.value = []; // Очищаем в случае ошибки
    }
  }

  function selectLocation(location) {
    selectedLocation.value = location;
  }

  return { locations, selectedLocation, fetchLocations, selectLocation };
});
