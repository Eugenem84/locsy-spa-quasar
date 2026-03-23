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
      const { data } = await api.get('/api/locations/by-bounds', { params });
      locations.value = data;
    } catch (error) {
      console.error('Error fetching locations by bounds:', error);
      locations.value = [];
    }
  }

  function selectLocation(location) {
    selectedLocation.value = location;
  }

  // This function just adds a location to the local state
  function addLocation(location) {
    locations.value.unshift(location);
  }

  // This function handles the API call
  async function createLocation(formData) {
    // The 'try...catch' block is removed from here.
    // The component that calls this action will be responsible for handling errors.
    // This makes the store more reusable and predictable.
    const { data } = await api.post('/api/locations', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    // On success, add the new location to the state and return it
    addLocation(data);
    return data;
  }

  return { locations, selectedLocation, fetchLocations, fetchLocationsByBounds, selectLocation, createLocation, addLocation };
});
