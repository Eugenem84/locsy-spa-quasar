<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { api } from 'boot/axios.js'
import { useCityStore } from "stores/city.js";
import { useLocationStore } from "stores/location.js";
import { useRouter } from "vue-router";
import { useAuthStore } from "stores/auth-store";

const cityStore = useCityStore()
const locationStore = useLocationStore()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const favorites = ref([])

const locations = computed(() => locationStore.locations)

async function loadLocations() {
  const cityId = cityStore.selectedCity?.id;
  if (!cityId) {
    locationStore.locations = [];
    return;
  }
  loading.value = true;
  try {
    await locationStore.fetchLocationsForList(cityId);
  } catch (err) {
    console.error('error loading locations: ', err);
  } finally {
    loading.value = false;
  }
}

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
  loadLocations();
});

watch(
  () => cityStore.selectedCity?.id,
  () => {
    loadLocations();
  }
);

watch(
  () => locationStore.selectedCategoryIds,
  () => {
    loadLocations();
  },
  { deep: true }
);

function selectLocation(location){
  if (location?.id) {
    router.push({ name: 'Location', params: { id: location.id } })
  }
}

function isFavorite(location) {
  return favorites.value.includes(location.id);
}

async function toggleFavorite(location) {
  if (!authStore.isLoggedIn) {
    router.push('/login');
    return;
  }

  const locationId = location.id;
  try {
    if (isFavorite(location)) {
      await api.delete(`/api/locations/${locationId}/favorite`);
      favorites.value = favorites.value.filter(id => id !== locationId);
    } else {
      await api.post(`/api/locations/${locationId}/favorite`);
      favorites.value.push(locationId);
    }
  } catch (error) {
    console.error('Failed to toggle favorite:', error);
  }
}
</script>

<template>
  <q-scroll-area style="height: 100vh;">
    <div class="q-pa-md">
      <div v-if="loading" class="text-center q-my-lg">
        <q-spinner-dots color="primary" size="40px" />
      </div>

      <div v-else-if="locations.length > 0" class="q-gutter-y-lg">
        <q-card
          v-for="location in locations"
          :key="location.id"
          class="my-card"
          flat
          bordered
        >
          <div class="absolute-top-right q-pa-xs" style="z-index: 1;">
            <q-btn
              flat
              round
              :icon="isFavorite(location) ? 'favorite' : 'favorite_border'"
              color="blue"
              @click.stop="toggleFavorite(location)"
            />
          </div>

          <q-card-section @click="selectLocation(location)" class="cursor-pointer">
            <div class="text-h6 text-weight-medium">{{ location.name }}</div>
          </q-card-section>

          <q-scroll-area horizontal style="height: 160px; width: 100%;" @click="selectLocation(location)" class="cursor-pointer">
            <div class="row no-wrap q-gutter-sm q-px-md">
              <q-img
                v-for="photo in location.photos"
                :key="photo.id"
                :src="photo.full_url"
                class="rounded-borders"
                spinner-color="grey-5"
                style="width: 250px; height: 150px;"
              >
                <template v-if="!location.photos || location.photos.length === 0">
                  <div class="absolute-full flex flex-center bg-grey-3 text-grey-8">
                    Нет фото
                  </div>
                </template>
              </q-img>
            </div>
          </q-scroll-area>

          <q-card-section @click="selectLocation(location)" class="cursor-pointer">
            <p class="text-body2 text-grey-8 ellipsis-3-lines">
              {{ location.description || 'Нет описания.' }}
            </p>
          </q-card-section>
        </q-card>
      </div>

      <div v-else-if="!cityStore.selectedCity" class="text-center text-grey q-my-lg">
        Выберите город, чтобы увидеть список локаций.
      </div>

      <div v-else class="text-center text-grey q-my-lg">
        В этом городе пока нет локаций.
      </div>

    </div>
  </q-scroll-area>
</template>

<style scoped>
.my-card {
  position: relative;
  transition: box-shadow 0.2s ease-in-out;
}

.my-card:hover {
  box-shadow: 0 1px 5px rgba(0,0,0,0.2), 0 2px 2px rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12);
}

.ellipsis-3-lines {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
