<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { api } from 'boot/axios.js'

const route = useRoute()
const id = route.params.id
const location = ref(null)
const loading = ref(true)

// Галерея теперь будет использовать full_url из данных
const photoGallery = computed(() => {
  if (location.value?.photos && location.value.photos.length > 0) {
    // Используем новое поле full_url
    return location.value.photos.map(p => p.full_url);
  }
  // Плейсхолдеры, если фото все еще нет
  return Array(5).fill('https://via.placeholder.com/600x400?text=Фото+локации');
});

onMounted(async () => {
  loading.value = true;
  try {
    const response = await api.get(`/api/location/${id}`)
    location.value = response.data
  } catch (error) {
    console.error('Failed to fetch location:', error)
  } finally {
    loading.value = false;
  }
})

</script>

<template>
  <q-page class="location-page">
    <div v-if="loading" class="fullscreen row flex-center">
      <q-spinner color="primary" size="3em" />
    </div>

    <div v-if="!loading && location">
      <!-- Название локации -->
      <div class="q-pa-md">
        <h4 class="text-h4 text-weight-bold q-mb-sm">{{ location.name }}</h4>
      </div>

      <!-- Сетка фотографий (70% высоты страницы) -->
      <q-scroll-area :style="{ height: '70vh' }" class="q-mb-md">
        <div class="photo-grid q-pa-md">
          <div
            v-for="(photoUrl, index) in photoGallery"
            :key="index"
            class="photo-card"
          >
            <q-img
              :src="photoUrl"
              :ratio="4/3"
              spinner-color="grey-5"
              class="rounded-borders"

            />
          </div>
        </div>
      </q-scroll-area>

      <!-- Описание -->
      <div class="q-pa-md q-mt-md">
        <p class="text-body1 text-grey-8">{{ location.description }}</p>
      </div>
    </div>

    <div v-if="!loading && !location" class="fullscreen row flex-center text-h6 text-grey">
      Не удалось загрузить информацию о локации.
    </div>
  </q-page>
</template>

<style scoped>
.location-page {
  background-color: #f9f9f9;
}

.text-h4 {
  line-height: 1.2;
}

.photo-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.photo-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.2s ease;
}

.photo-card:hover {
  transform: translateY(-4px);
}

.photo-card .q-img {
  width: 100%;
  height: auto;
}
</style>
