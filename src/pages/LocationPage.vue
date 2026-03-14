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
    <div v-if="location">
      <h4> {{location.data.name}}</h4>
      <p><strong>Описание: </strong> {{location.data.description}}</p>
    </div>
    <div v-else>
      <q-spinner color="primary" />
    </div>
  </q-page>
</template>

<style scoped>

</style>
