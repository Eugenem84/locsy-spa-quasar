<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { useCityStore } from 'stores/city'

const cityStore = useCityStore()

onMounted(() => {
  cityStore.fetchCities()
})
</script>
