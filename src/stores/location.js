// /stores/location.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from 'boot/axios';

export const useLocationStore = defineStore('location', () => {
  const locations = ref([]);
  const selectedLocation = ref(null);
  const selectedCategoryIds = ref([]); // Новое состояние для ID категорий

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

  /**
   * Локации в видимой области карты.
   *
   * @param {[[number, number], [number, number]]} bounds
   *   Границы в формате [[широта юго-запада, долгота юго-запада],
   *   [широта северо-востока, долгота северо-востока]] —
   *   в таком виде их отдаёт YandexMapView (см. map.bounds в ymaps3).
   */
  async function fetchLocationsByBounds(bounds) {
    try {
      const [[swLat, swLng], [neLat, neLng]] = bounds;
      const params = {
        sw_lat: swLat,
        sw_lng: swLng,
        ne_lat: neLat,
        ne_lng: neLng,
      };

      if (selectedCategoryIds.value.length > 0) {
        params.category_ids = selectedCategoryIds.value;
      }

      const { data } = await api.get('/api/locations/by-bounds', { params });
      locations.value = data;
    } catch (error) {
      console.error('Error fetching locations by bounds:', error);
      locations.value = [];
    }
  }

  async function fetchLocationsForList(cityId) {
    if (!cityId) {
      locations.value = [];
      return;
    }
    try {
      const params = { city_id: cityId };
      if (selectedCategoryIds.value.length > 0) {
        params.category_ids = selectedCategoryIds.value;
      }
      const { data } = await api.get('/api/locations', { params });
      locations.value = data;
    } catch (error) {
      console.error('Error fetching locations for list:', error);
      locations.value = [];
    }
  }

  function selectLocation(location) {
    selectedLocation.value = location;
  }

  function setSelectedCategoryIds(ids) {
    selectedCategoryIds.value = ids;
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
    // The component will handle the response and decide whether to refetch or not.
    return data;
  }

  return { locations, selectedLocation, selectedCategoryIds, fetchLocations, fetchLocationsByBounds, fetchLocationsForList, selectLocation, createLocation, addLocation, setSelectedCategoryIds };
});
