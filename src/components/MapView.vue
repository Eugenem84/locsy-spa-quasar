<script setup>
  import {ref} from 'vue'
  import 'leaflet/dist/leaflet.css'
  import 'leaflet/dist/leaflet.js'
  import {
    LMap,
    LTileLayer,
    LMarker,
    //LPopup
  } from '@vue-leaflet/vue-leaflet'

  const mapCenter = ref([55.751244, 37.618423])
  const locations = ref([
    {id: 1, name: 'Парк Горького', lat: 55.729876, lng: 37.603493, rating: 4.7},
    {id: 2, name: 'ВДНХ', lat: 55.829895, lng: 37.633266, rating: 4.6},
  ])

  const hoverLocation = ref(null)
  const modalOpen = ref(false)
  const selectedLocation = ref(null)

  function openLocationModal(loc) {
    selectedLocation.value = loc
    modalOpen.value = true
  }

  function onBoundsChange(bounds) {
    console.log("карта обновлена", bounds)
  }

</script>

<template>
  <LMap
    style="height: 100vh; width: 100%;"
    :zoom="13"
    :center="mapCenter"
    @update:bounds="onBoundsChange"
  >

    <LTileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    />

    <LMarker
      v-for="location in locations"
      :key="location.id"
      :lat-lng="[location.lat, location.lng]"
      :mouseover="hoverLocation = location"
      @click="openLocationModal(location)"
    />
  </LMap>

  <q-dialog v-model="modalOpen" persistent>
    <q-card style="min-width: 90vw; min-height: 90vh">
      <q-card-section>
        <div class="text-h6">{{ selectedLocation?.name }}</div>

      </q-card-section>
    </q-card>
  </q-dialog>

</template>

<style scoped>

</style>
