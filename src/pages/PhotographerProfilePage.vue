<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from 'boot/axios.js'

const route = useRoute()
const router = useRouter()
const photographer = ref(null)
const loading = ref(true)

onMounted(async () => {
  const photographerId = route.params.id
  try {
    const response = await api.get(`/api/photographers/${photographerId}`)
    photographer.value = response.data
  } catch (error) {
    console.error('Failed to fetch photographer profile:', error)
  } finally {
    loading.value = false
  }
})

function goBack() {
  router.back()
}
</script>

<template>
  <q-page class="q-pa-md">
    <q-page-sticky position="top-left" :offset="[18, 18]" style="z-index: 10">
      <q-btn round dense push icon="arrow_back" @click="goBack" color="white" text-color="primary"/>
    </q-page-sticky>

    <div v-if="loading" class="text-center">
      <q-spinner-dots color="primary" size="40px" />
    </div>

    <div v-if="!loading && photographer">
      <q-card class="q-mb-md">
        <q-card-section class="text-center">
          <q-avatar size="150px" class="q-mb-md">
            <img :src="photographer.avatar || 'https://cdn.quasar.dev/img/boy-avatar.png'">
          </q-avatar>
          <div class="text-h5">{{ photographer.display_name }}</div>
          <div v-if="photographer.city" class="text-subtitle1 text-grey">{{ photographer.city.name }}</div>
        </q-card-section>
      </q-card>

      <q-card class="q-mb-md">
        <q-card-section>
          <div class="text-h6">Описание</div>
          <p>{{ photographer.description }}</p>
        </q-card-section>
      </q-card>

      <q-card class="q-mb-md">
        <q-card-section>
          <div class="text-h6">Типы съемок</div>
          <q-chip v-for="workType in photographer.work_types" :key="workType" color="primary" text-color="white">
            {{ workType }}
          </q-chip>
        </q-card-section>
      </q-card>

      <q-card>
        <q-card-section>
          <div class="text-h6">Контакты</div>
          <q-list>
            <q-item v-if="photographer.instagram" clickable :href="`https://instagram.com/${photographer.instagram}`" target="_blank">
              <q-item-section avatar>
                <q-icon name="fab fa-instagram" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ photographer.instagram }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item v-if="photographer.telegram" clickable :href="`https://t.me/${photographer.telegram}`" target="_blank">
              <q-item-section avatar>
                <q-icon name="fab fa-telegram" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ photographer.telegram }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item v-if="photographer.website" clickable :href="photographer.website" target="_blank">
              <q-item-section avatar>
                <q-icon name="fas fa-globe" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ photographer.website }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item v-if="photographer.vk" clickable :href="photographer.vk" target="_blank">
              <q-item-section avatar>
                <q-icon name="fab fa-vk" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ photographer.vk }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </div>

    <div v-if="!loading && !photographer" class="text-center">
      <div class="text-h6">Не удалось загрузить профиль фотографа.</div>
    </div>
  </q-page>
</template>

<style scoped>
.q-card {
  border-radius: 12px;
}
</style>
