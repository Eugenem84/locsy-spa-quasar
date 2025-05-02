<template>
  карта
  <YandexMap
    :settings="{
      location:
        {
          center: [37.588144, 55.733842],
          zoom: 10
        }
      }"
    style="width: 100%; height: 400px"
  >
    <YandexMapDefaultSchemeLayer />
    <YandexMapDefaultFeaturesLayer />
<!--    <YandexMapDefaultMarker-->
<!--      :coordinates="[37.588144, 55.733842]"-->
<!--      :properties="{ iconContent: 'Москва' }"-->
<!--      :draggable="false"-->
<!--    >-->
<!--    </YandexMapDefaultMarker>-->
  </YandexMap>
</template>

<script setup>
//import '@yandex/ymaps3-default-ui-theme'
import {
  YandexMap,
  YandexMapDefaultFeaturesLayer,
  //YandexMapMarker,
  YandexMapDefaultSchemeLayer,
  //YandexMapDefaultMarker
} from 'vue-yandex-maps'
</script>
