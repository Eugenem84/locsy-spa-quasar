<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import 'leaflet/dist/leaflet.css'
import 'leaflet/dist/leaflet.js'
import {
  LMap,
  LTileLayer,
  LMarker,
  LTooltip,
} from '@vue-leaflet/vue-leaflet'
import { useCityStore } from "stores/city.js";
import { useLocationStore } from "stores/location.js";
import { useRouter } from "vue-router";
import { useAuthStore } from "stores/auth-store";
import { api } from 'boot/axios.js'
import L from 'leaflet';
import { debounce } from 'quasar';

const router = useRouter();
const cityStore = useCityStore();
const locationStore = useLocationStore();
const authStore = useAuthStore();

const favorites = ref([]);
const mapRef = ref(null); // Ref for the map instance
const mapInstance = computed(() => mapRef.value?.leafletObject);

const initialCenter = computed(() => cityStore.selectedCity?.coords || [55.751244, 37.618423]); // Default to Moscow
const locations = computed(() => locationStore.locations);
const selectedLocation = computed(() => locationStore.selectedLocation);

const modalOpen = ref(false);

const fetchLocations = debounce(async () => {
  if (!mapInstance.value) return;

  console.log('карта сдвинулась, запрашиваю новые локации...');

  const bounds = mapInstance.value.getBounds();
  console.log('Текущие границы карты (объект):', bounds); // <--- ДОБАВЛЕНО ДЛЯ ДЕТАЛЬНОЙ ДИАГНОСТИКИ

  await locationStore.fetchLocationsByBounds(bounds);
}, 300);


async function fetchFavorites() {
  if (!authStore.isLoggedIn) return;
  try {
    const response = await api.get('/api/favorites');
    favorites.value = response.data.map(fav => fav.id);
  } catch (error) {
    console.error('Failed to fetch favorites:', error);
  }
}

onMounted(() => {
  fetchFavorites();
});

// When the selected city changes, fly to its coordinates
watch(() => cityStore.selectedCity, (newCity) => {
  if (newCity && mapInstance.value) {
    mapInstance.value.flyTo(newCity.coords, 12);
  }
});

watch(selectedLocation, (newVal) => {
  modalOpen.value = !!newVal;
});

function openLocationModal(loc) {
  locationStore.selectLocation(loc);
}

function closeModal() {
  locationStore.selectLocation(null);
}

function goToLocation() {
  if (selectedLocation.value?.id) {
    router.push({ name: 'Location', params: { id: selectedLocation.value.id } });
  }
}

// Custom Icons
const defaultIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const favoriteIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

function getMarkerIcon(location) {
  return favorites.value.includes(location.id) ? favoriteIcon : defaultIcon;
}
</script>

<template>
  <LMap
    ref="mapRef"
    style="height: 92vh; width: 100%;"
    :zoom="12"
    :center="initialCenter"
    :attribution-control="false"
    @ready="fetchLocations"
    @moveend="fetchLocations"
  >

    <LTileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    />

    <LMarker
      v-for="location in locations"
      :key="location.id"
      :lat-lng="[location.latitude, location.longitude]"
      :icon="getMarkerIcon(location)"
      @click="openLocationModal(location)"
    >
      <LTooltip
        :permanent="true"
        :interactive="false"
        direction="top"
        offset="[0, -10]"
      >
        {{ location.name }}
      </LTooltip>
    </LMarker>
  </LMap>

  <!-- Обертка для центрирования -->
  <div class="location-bottom-sheet-wrapper">
    <q-card v-if="modalOpen"
            class="location-bottom-sheet"
            @click="goToLocation"
    >
      <!-- Кнопка закрытия -->
      <q-btn
        flat
        dense
        icon="close"
        @click.stop="closeModal"
        class="absolute-top-right q-ma-sm z-top"
      />

      <q-card-section class="text-center">
        <div class="text-h6 q-mb-sm">{{ selectedLocation?.name }}</div>

        <q-scroll-area
          horizontal
          style="height: 200px; max-width: 100%;"
          class="q-mb-md"
        >
          <div class="row no-wrap">
            <div v-for="photo in selectedLocation?.photos" :key="photo.id" class="q-mr-md">
              <q-img
                :src="photo.full_url"
                style="width: 300px; height: 200px; border-radius: 10px;"
                fit="cover"
              />
            </div>
          </div>
        </q-scroll-area>

        <div class="text-grey-14">{{ selectedLocation?.description}}</div>
      </q-card-section>
    </q-card>
  </div>

</template>

<style scoped>

::v-deep .leaflet-control-attribution {
  display: none !important;
}

.location-bottom-sheet-wrapper {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  pointer-events: none; /* чтобы клики проходили сквозь обертку */
}

.location-bottom-sheet {
  pointer-events: all; /* чтобы клики работали по карточке */
  width: 95%;
  min-height: 40vh;
  margin-bottom: 5%;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  background: white;
  z-index: 999;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
  position: relative;
}
</style>
