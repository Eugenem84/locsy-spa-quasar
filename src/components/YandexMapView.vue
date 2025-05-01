<template>
  карта
  <YandexMap
    :settings="{ location: { center: [55.75, 37.57], zoom: 10 } }"
    style="width: 100%; height: 400px"
  >
    <YandexMapMarker
      :settings="{
        coordinates: [55.75, 37.57],
        properties: { iconContent: 'Москва' }
      }"
    />
  </YandexMap>
</template>

<script setup>
// ничего не нужно импортировать — компоненты уже зарегистрированы глобально
import { YandexMap, YandexMapMarker } from 'vue-yandex-maps'
</script>
