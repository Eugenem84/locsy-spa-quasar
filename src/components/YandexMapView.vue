<template>
  <YandexMap
    height="92vh"
    width="100%"
    :settings="{
      location: { center: mapCenter, zoom: 12 },
      showScaleInCopyrights: true,
    }"
  >
    <YandexMapDefaultSchemeLayer />
    <YandexMapDefaultFeaturesLayer>
      <YandexMapDefaultMarker :settings="{ coordinates: mapCenter }" />
    </YandexMapDefaultFeaturesLayer>
  </YandexMap>
</template>

<script setup>
import { computed } from 'vue'
import { useCityStore } from 'stores/city.js'
import {
  YandexMap,
  YandexMapDefaultSchemeLayer,
  YandexMapDefaultFeaturesLayer,
  YandexMapDefaultMarker,
} from 'vue-yandex-maps'

const cityStore = useCityStore()

/** Yandex Maps 3: [долгота, широта]. В store coords — [широта, долгота] для Leaflet. */
const mapCenter = computed(() => {
  const coords = cityStore.selectedCity?.coords
  if (coords?.length === 2) {
    return [coords[1], coords[0]]
  }
  return [37.618423, 55.751244]
})
</script>
