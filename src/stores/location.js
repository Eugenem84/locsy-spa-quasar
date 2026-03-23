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

  async function fetchLocationsByBounds(bounds) {
    try {
      const params = {
        sw_lat: bounds.getSouthWest().lat,
        sw_lng: bounds.getSouthWest().lng,
        ne_lat: bounds.getNorthEast().lat,
        ne_lng: bounds.getNorthEast().lng,
      };
      console.log('Отправка запроса /api/locations/by-bounds с параметрами:', params); // <--- ДОБАВЛЕНО ДЛЯ ДИАГНОСТИКИ

      const { data } = await api.get('/api/locations/by-bounds', { params });

      console.log('Locations received from backend:', data);
      locations.value = data;
    } catch (error) {
      console.error('Error fetching locations by bounds:', error);
      locations.value = [];
    }
  }

  function selectLocation(location) {
    selectedLocation.value = location;
  }

  async function createLocation(formData) {
    try {
      const { data } = await api.post('/api/locations', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      // Add the new location to the list
      locations.value.push(data);
    } catch (error) {
      console.error('Error creating location:', error);
    }
  }

  return { locations, selectedLocation, fetchLocations, fetchLocationsByBounds, selectLocation, createLocation };
});
