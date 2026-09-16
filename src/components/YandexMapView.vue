<template>
  <YandexMap
    ref="mapRef"
    height="92vh"
    width="100%"
    :settings="{
      location: { center: mapCenter, zoom: 12 },
      showScaleInCopyrights: true,
    }"
    :class="{ 'picking-mode': isPickingMode }"
    @update="fetchLocations"
    @click="handleMapClick"
    @ready="onMapReady"
  >
    <YandexMapDefaultSchemeLayer />
    <YandexMapDefaultFeaturesLayer>
        <YandexMapMarker
            v-for="location in locations"
            :key="location.id"
            :settings="{ coordinates: [location.longitude, location.latitude] }"
            @click.stop="openLocationModal(location)"
            @mouseover="onMarkerMouseOver(location)"
            @mouseout="onMarkerMouseOut"
        >
            <div class="custom-marker" :style="getMarkerStyle(location)">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" :fill="getMarkerColor(location)">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
                </svg>
                <div class="tooltip">{{ location.name }}</div>
            </div>
        </YandexMapMarker>
    </YandexMapDefaultFeaturesLayer>
  </YandexMap>

  <!-- Location Detail Modal -->
  <div class="location-bottom-sheet-wrapper">
    <q-card v-if="modalOpen"
            class="location-bottom-sheet"
            @click="goToLocation"
    >
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
        <div class="text-grey-14 q-mb-md">{{ selectedLocation?.description}}</div>
      </q-card-section>
      <q-separator />
      <q-card-section v-if="selectedLocationAddress" class="text-center">
        <div class="text-subtitle2 text-grey-8 q-mb-xs">Адрес</div>
        <div class="text-caption text-grey">
          {{ selectedLocationAddress }}
        </div>
      </q-card-section>
    </q-card>
  </div>


  <q-dialog v-model="createLocationDialogOpen" @hide="onDialogHide">
    <CreateLocationForm
      v-if="newLocationCoords"
      :latitude="newLocationCoords[1]"
      :longitude="newLocationCoords[0]"
      @location-created="onLocationCreated"
    />
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch, onMounted, nextTick } from 'vue'
import { useCityStore } from 'stores/city.js'
import { useLocationStore } from "stores/location.js";
import { useAuthStore } from "stores/auth-store";
import { useRoute, useRouter } from "vue-router";
import {
  YandexMap,
  YandexMapDefaultSchemeLayer,
  YandexMapDefaultFeaturesLayer,
  YandexMapMarker,
} from 'vue-yandex-maps'
import { debounce, useQuasar } from 'quasar';
import CreateLocationForm from "components/CreateLocationForm.vue";
import { api } from 'boot/axios.js'

const router = useRouter();
const route = useRoute();
const cityStore = useCityStore()
const locationStore = useLocationStore();
const authStore = useAuthStore();
const $q = useQuasar();

const mapRef = ref(null);
const isMapReady = ref(false);
const locations = computed(() => locationStore.locations);
const pickingNotification = ref(null);
const createLocationDialogOpen = ref(false);
const newLocationCoords = ref(null);

const selectedLocation = computed(() => locationStore.selectedLocation);
const selectedLocationAddress = ref('');
const modalOpen = ref(false);
const favorites = ref([]);
const hoveredLocationId = ref(null);


const isPickingMode = computed(() => route.query.picking === 'true');

/** Yandex Maps 3: [долгота, широта]. В store coords — [широта, долгота] для Leaflet. */
const mapCenter = computed(() => {
  const coords = cityStore.selectedCity?.coords
  if (coords?.length === 2) {
    return [coords[1], coords[0]]
  }
  return [37.618423, 55.751244]
})

const doFetchLocations = async () => {
  if (!isMapReady.value || !mapRef.value) return;
  try {
    const boundsRaw = await mapRef.value.getBounds();
    const bounds = [
        [boundsRaw[0][1], boundsRaw[0][0]],
        [boundsRaw[1][1], boundsRaw[1][0]]
    ];
    await locationStore.fetchLocationsByBounds(bounds);
  } catch (e) {
    console.error("Failed to fetch locations by bounds:", e);
  }
};

const fetchLocations = debounce(doFetchLocations, 300);

async function fetchFavorites() {
  if (!authStore.isLoggedIn) return;
  try {
    const response = await api.get('/api/favorites');
    favorites.value = response.data.map(fav => fav.id);
  } catch (error) {
    console.error('Failed to fetch favorites:', error);
  }
}

async function initializeMap() {
  await fetchFavorites();
  await doFetchLocations();
}

function onMapReady() {
  isMapReady.value = true;
  initializeMap();
}

watch(isPickingMode, (isPicking) => {
  if (isPicking) {
    document.addEventListener('keydown', handleEscKey);
    showPickingNotification();
  } else {
    document.removeEventListener('keydown', handleEscKey);
    if (pickingNotification.value) {
      pickingNotification.value();
      pickingNotification.value = null;
    }
  }
});

function showPickingNotification() {
  pickingNotification.value = $q.notify({
    message: 'Выберите место на карте для создания новой локации.',
    color: 'primary',
    icon: 'place',
    position: 'bottom',
    timeout: 0,
    actions: [
      { label: 'Отмена', color: 'white', handler: () => cancelPickingMode() }
    ]
  });
}

function cancelPickingMode() {
  router.push({ path: '/' });
}

function handleEscKey(event) {
  if (event.key === 'Escape') {
    cancelPickingMode();
  }
}

async function handleMapClick(event) {
  if (isPickingMode.value) {
    if (pickingNotification.value) {
      pickingNotification.value();
      pickingNotification.value = null;
    }

    if (isMapReady.value && mapRef.value && typeof event.clientX === 'number' && typeof event.clientY === 'number') {
      try {
        const coords = await mapRef.value.screenToWorld({ x: event.clientX, y: event.clientY });

        if (coords) {
          newLocationCoords.value = coords;
          nextTick(() => {
            createLocationDialogOpen.value = true;
          });
        }
      } catch (e) {
        console.error('Error calling screenToWorld:', e);
      }
    }
  }
}

function onDialogHide() {
  if (isPickingMode.value) {
    router.push({ path: '/' });
  }
  // Сбрасываем координаты после закрытия диалога
  newLocationCoords.value = null;
}

function onLocationCreated() {
  createLocationDialogOpen.value = false;
}

onMounted(() => {
  if (isPickingMode.value) {
    document.addEventListener('keydown', handleEscKey);
    showPickingNotification();
  }
});

watch(() => authStore.isLoggedIn, (isLoggedIn) => {
  if (isLoggedIn) {
    fetchFavorites();
  } else {
    favorites.value = [];
  }
});

watch(selectedLocation, (newVal) => {
  modalOpen.value = !!newVal;
});

async function fetchAddress(lat, lon) {
  try {
    selectedLocationAddress.value = 'Загрузка адреса...';
    const apiKey = process.env.YANDEX_MAPS_API_KEY;
    const response = await api.get(`https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&format=json&geocode=${lon},${lat}`);
    const data = response.data;
    const geoObject = data.response.GeoObjectCollection.featureMember[0]?.GeoObject;
    if (geoObject) {
      selectedLocationAddress.value = geoObject.metaDataProperty.GeocoderMetaData.text;
    } else {
      selectedLocationAddress.value = 'Адрес не найден';
    }
  } catch (error) {
    console.error('There was a problem with the fetch operation:', error);
    selectedLocationAddress.value = 'Не удалось загрузить адрес';
  }
}

function openLocationModal(loc) {
  if (isPickingMode.value) {
    return;
  }
  locationStore.selectLocation(loc);
  fetchAddress(loc.latitude, loc.longitude);
}

function closeModal() {
  locationStore.selectLocation(null);
  selectedLocationAddress.value = '';
}

function goToLocation() {
  if (selectedLocation.value?.id) {
    router.push({ name: 'Location', params: { id: selectedLocation.value.id } });
  }
}

const defaultMarkerColor = '#1861b1';
const favoriteMarkerColor = '#F97316';

function getMarkerColor(location) {
  return favorites.value.includes(location.id) ? favoriteMarkerColor : defaultMarkerColor;
}

function getMarkerStyle(location) {
    const isHovered = hoveredLocationId.value === location.id;
    const size = isHovered ? 48 : 36;
    return {
        width: `${size}px`,
        height: `${size}px`,
        transform: `translate(-${size / 2}px, -${size}px)`,
    };
}

function onMarkerMouseOver(location) {
  hoveredLocationId.value = location.id;
}

function onMarkerMouseOut() {
  hoveredLocationId.value = null;
}


watch(() => cityStore.selectedCity, (newCity) => {
  if (newCity && isMapReady.value && mapRef.value) {
    mapRef.value.setLocation({
      center: [newCity.coords[1], newCity.coords[0]],
      zoom: 12
    });
  }
});

watch(() => locationStore.selectedCategoryIds, () => {
  doFetchLocations();
}, { deep: true });

</script>

<style scoped>
.picking-mode {
  cursor: crosshair;
}

.location-bottom-sheet-wrapper {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  pointer-events: none;
}

.location-bottom-sheet {
  pointer-events: all;
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

.custom-marker {
    position: absolute;
    left: 0;
    top: 0;
    transition: width 0.3s ease, height 0.3s ease, transform 0.3s ease;
    will-change: transform;
}

.custom-marker svg {
    width: 100%;
    height: 100%;
}

.tooltip {
    position: absolute;
    top: -25px;
    left: 50%;
    transform: translateX(-50%);
    background-color: white;
    padding: 5px 10px;
    border-radius: 5px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.3s;
    pointer-events: none;
}

.custom-marker:hover .tooltip {
    opacity: 1;
}
</style>
