<template>
  <q-page class="relative">

    <div class="absolute-top-right q-pa-sm" style="z-index:1000">
      <q-btn-toggle
        v-model="mapMode"
        push
        rounded
        glossy
        toggle-color="blue"
        :options="[
          { value: 'map', slot: 'map'},
          { value: 'list', slot: 'list'}
        ]"
      >
        <template v-slot:map>
          <q-icon name="map" /> Карта
        </template>
        <template v-slot:list>
          <q-icon name="list" /> Список
        </template>
      </q-btn-toggle>
    </div>

    <MapView v-if="mapMode === 'map'" />
    <ListView v-else />

    <!-- наш роутинг‑оверлей -->
    <q-dialog v-model="dialogOpen"
              persistent
    >
      <q-card style="min-width: 90vw; min-height: 90vh">
        <LocationPage
          :id="locationId"
          @close="closeDialog"
        />
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const mapMode = ref('map')

import MapView from 'components/MapView.vue'
import LocationPage from 'pages/LocationPage.vue'
import ListView from "components/ListView.vue";

const router = useRouter()

const dialogOpen = ref(false)
const locationId = ref(null)

// watch(() => route.params.id, id => {
//   if (id) {
//     locationId.value = id
//     dialogOpen.value = true
//   }
//   else {
//     dialogOpen.value = false
//   }
// })

// закрыть и вернуться на карту
function closeDialog() {
  router.push({ name: 'Map' })
  router.push({path: '/'})
}
</script>
