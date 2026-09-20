<script setup>
import { onMounted, ref, computed } from 'vue'
import { api } from 'boot/axios'
import { useRouter } from 'vue-router'
import { useCityStore } from 'stores/city'
import { formatCityName } from 'src/utils/city-name.js'

const favorites = ref([])
const loading = ref(true)
const router = useRouter()
const cityStore = useCityStore()

async function fetchFavorites() {
  try {
    const response = await api.get('/api/favorites')
    favorites.value = response.data
  } catch (error) {
    console.error('Failed to fetch favorites:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchFavorites()
})

const filteredFavorites = computed(() => {
  if (!cityStore.selectedCity) {
    return favorites.value
  }
  return favorites.value.filter(location => location.city_id === cityStore.selectedCity.id)
})

function goToLocation(id) {
  router.push(`/location/${id}`)
}

function goBack() {
  router.back()
}

function descriptionPreview(description) {
  if (!description) return 'Без описания'
  return description.length > 100 ? `${description.substring(0, 100)}…` : description
}

async function removeFromFavorites(location) {
  const locationId = location.id;
  try {
    await api.delete(`/api/locations/${locationId}/favorite`);
    favorites.value = favorites.value.filter(fav => fav.id !== locationId);
  } catch (error) {
    console.error('Failed to remove favorite:', error);
  }
}
</script>

<template>
  <q-page class="q-pa-md">
    <q-page-sticky position="top-left" :offset="[18, 18]" style="z-index: 10">
      <q-btn round dense push icon="arrow_back" @click="goBack" color="white" text-color="primary"/>
    </q-page-sticky>

    <h4 class="text-h4 text-weight-bold q-mb-md text-center">Избранные локации</h4>

    <div v-if="loading" class="row flex-center">
      <q-spinner color="primary" size="3em" />
    </div>

    <div v-if="!loading && filteredFavorites.length === 0" class="text-center text-grey">
      <p v-if="!cityStore.selectedCity">У вас пока нет избранных локаций.</p>
      <p v-else>В городе {{ cityStore.selectedCity.name }} нет избранных локаций.</p>
      <q-btn to="/" label="Найти локации" color="primary" />
    </div>

    <div v-if="!loading && filteredFavorites.length > 0" class="locations-grid">
      <q-card
        v-for="location in filteredFavorites"
        :key="location.id"
        class="location-card"
      >
        <div class="absolute-top-right q-pa-xs" style="z-index: 1;">
          <q-btn
            flat
            round
            icon="favorite"
            color="blue"
            @click.stop="removeFromFavorites(location)"
          />
        </div>

        <div @click="goToLocation(location.id)" class="cursor-pointer">
          <div
            v-if="!location.photos || location.photos.length === 0"
            class="row flex-center bg-grey-3 text-grey-8"
            style="aspect-ratio: 4 / 3"
          >
            Нет фото
          </div>

          <!-- Без принудительного ratio: q-img использует пропорции фото. -->
          <q-img
            v-else
            :src="location.photos[0].full_url"
            class="location-card-image"
          >
            <q-badge
              v-if="location.city"
              class="q-ma-sm"
              color="white"
              text-color="primary"
              position="top-left"
            >
              {{ formatCityName(location.city.name) }}
            </q-badge>
          </q-img>

          <q-card-section>
            <div class="text-h6 text-weight-bold">{{ location.name }}</div>
            <div class="text-caption text-grey">{{ descriptionPreview(location.description) }}</div>
          </q-card-section>
        </div>
      </q-card>
    </div>
  </q-page>
</template>

<style scoped>
.locations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.location-card {
  position: relative;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.location-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.location-card-image .q-badge {
  border-radius: 4px;
}
</style>
