<script setup>
import { onMounted, ref, computed } from 'vue'
import { api } from 'boot/axios'
import { useRouter } from 'vue-router'
import { useCityStore } from 'stores/city'

const favorites = ref([])
const loading = ref(true)
const router = useRouter()
const cityStore = useCityStore()

onMounted(async () => {
  try {
    const response = await api.get('/api/favorites')
    favorites.value = response.data
  } catch (error) {
    console.error('Failed to fetch favorites:', error)
  } finally {
    loading.value = false
  }
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
        @click="goToLocation(location.id)"
        class="location-card cursor-pointer"
      >
        <q-img
          :src="location.photos.length > 0 ? location.photos[0].full_url : 'https://via.placeholder.com/300'"
          :ratio="4/3"
          class="location-card-image"
        >
          <q-badge
            v-if="location.city"
            class="q-ma-sm"
            color="white"
            text-color="primary"
            position="top-left"
          >
            {{ location.city.name }}
          </q-badge>
        </q-img>

        <q-card-section>
          <div class="text-h6 text-weight-bold">{{ location.name }}</div>
          <div class="text-caption text-grey">{{ location.description.substring(0, 100) }}...</div>
        </q-card-section>
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
