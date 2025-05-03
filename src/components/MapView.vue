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
  import {useCityStore} from "stores/city.js";
  import { computed } from "vue";
  import { useRouter } from "vue-router";

  const router = useRouter()

  const cityStore = useCityStore()

  const mapCenter = computed(() => cityStore.selectedCity.coords)

  console.log('selectedCityCoords: ', cityStore.selectedCity.coords)

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
    //router.push({name: 'Location', params: { id: loc.id}})
  }

  function onBoundsChange(bounds) {
    console.log("карта обновлена", bounds)
  }

  function goToLocation(){
    if (selectedLocation.value?.id) {
      router.push({name: 'Location', params: { id: selectedLocation.value.id}})
    }
  }

</script>

<template>
  <LMap
    style="height: 92vh; width: 100%;"
    :zoom="12"
    :center="mapCenter"
    :attribution-control="false"
    @update:bounds="onBoundsChange"
  >

    <LTileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    />

    <LMarker
      v-for="location in locations"
      :key="location.id"
      :lat-lng="[location.lat, location.lng]"
      :mouseover="hoverLocation = location.name"
      @click="openLocationModal(location)"
    />
  </LMap>

  <!-- Обертка для центрирования -->
  <div class="location-bottom-sheet-wrapper">
    <q-card v-if="modalOpen"
            class="location-bottom-sheet"
            @click="goToLocation"
    >
      <!-- Кнопка закрытия -->
      <q-btn
        flat
        dense
        icon="close"
        @click.stop="modalOpen = false"
        class="absolute-top-right q-ma-sm z-top"
      />

      <q-card-section class="text-center">
        <div class="text-h6">{{ selectedLocation?.name }}</div>
      </q-card-section>
    </q-card>
  </div>


</template>

<style scoped>

::v-deep .leaflet-control-attribution {
  display: none !important;
}

.location-bottom-sheet-wrapper {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  pointer-events: none; /* чтобы клики проходили сквозь обертку */
}

.location-bottom-sheet {
  pointer-events: all; /* чтобы клики работали по карточке */
  width: 95%;
  min-height: 40vh;
  margin-bottom: 5%;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  background: white;
  z-index: 999;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
  position: relative;
}
</style>
