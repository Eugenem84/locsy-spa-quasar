<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api } from 'boot/axios.js'

const route = useRoute()
const id = route.params.id
const location = ref(null)

onMounted(async () => {
  try {
    // Добавляем префикс /api
    const response = await api.get(`/api/location/${id}`)
    location.value = response.data
    console.log('location: ', location.value)
  } catch (error) {
    console.error('Failed to fetch location:', error)
    // Тут можно добавить обработку ошибок, например, показать сообщение пользователю
  }
})

</script>

<template>
  <q-page class="q-pa-md">
    <div v-if="location">
      <h4>{{ location.name }}</h4>
      <p><strong>Описание: </strong> {{ location.description }}</p>
    </div>
    <div v-else>
      <q-spinner color="primary" />
    </div>
  </q-page>
</template>

<style scoped>

</style>
