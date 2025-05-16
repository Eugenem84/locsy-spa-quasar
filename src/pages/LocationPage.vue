<script setup>
import { onMounted, ref } from 'vue'
import {useRoute} from 'vue-router'
import { api } from 'boot/axios.js'

const route = useRoute()
const id = route.params.id
const location = ref(null)

onMounted(async () => {
  const response = await api(`http://localhost:9000/location/${id}`)
  location.value = await response
  console.log('location: ', location)
})

</script>

<template>

  <q-page class="q-pa-md">
    <h4> локация #{{id}}</h4>
    <div v-if="location">
      <p><strong>Название: </strong> {{location.data.name }}</p>
      <p><strong>Описание: </strong> {{location.data.description}}</p>
    </div>
    <div v-else>
      <q-spinner color="primary" />
    </div>
  </q-page>
</template>

<style scoped>

</style>
