<script setup>
  import { ref, computed, watch } from 'vue'
  import 'leaflet/dist/leaflet.css'
  import 'leaflet/dist/leaflet.js'
  import {
    LMap,
    LTileLayer,
    LMarker,
    LTooltip,
  } from '@vue-leaflet/vue-leaflet'
  import { useCityStore } from "stores/city.js";
  import { useLocationStore } from "stores/location.js";
  import { useRouter } from "vue-router";

  const router = useRouter();
  const cityStore = useCityStore();
  const locationStore = useLocationStore();

  const mapCenter = computed(() => cityStore.selectedCity?.coords || [0, 0]);
  const locations = computed(() => locationStore.locations);
  const selectedLocation = computed(() => locationStore.selectedLocation);

  const modalOpen = ref(false);

  watch(
    () => cityStore.selectedCity?.id,
    (newId) => {
      locationStore.fetchLocations(newId);
    },
    { immediate: true }
  );

  watch(selectedLocation, (newVal) => {
    modalOpen.value = !!newVal;
  });

  function openLocationModal(loc) {
    locationStore.selectLocation(loc);
  }

  function closeModal() {
    locationStore.selectLocation(null);
  }

  function goToLocation() {
    if (selectedLocation.value?.id) {
      router.push({ name: 'Location', params: { id: selectedLocation.value.id } });
    }
  }

</script>

<template>
  <LMap
    style="height: 92vh; width: 100%;"
    :zoom="12"
    :center="mapCenter"
    :attribution-control="false"
  >

    <LTileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    />

    <LMarker
      v-for="location in locations"
      :key="location.id"
      :lat-lng="[location.latitude, location.longitude]"
      @click="openLocationModal(location)"
    >
      <LTooltip
        :permanent="true"
        :interactive="false"
        direction="top"
        offset="[0, -10]"
      >
        {{ location.name }}
      </LTooltip>
    </LMarker>
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
        @click.stop="closeModal"
        class="absolute-top-right q-ma-sm z-top"
      />

      <q-card-section class="text-center">
        <div class="text-h6">{{ selectedLocation?.name }}</div>
        <div class="text-grey-14">{{ selectedLocation?.description}}</div>
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
