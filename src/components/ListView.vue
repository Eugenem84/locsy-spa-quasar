<script setup>
import { ref, onMounted, watch } from 'vue'
import { api } from 'boot/axios.js'
import {useCityStore} from "stores/city.js";

const cityStore = useCityStore()

const locations = ref([])
const loading = ref(true)

async function loadLocations() {
  try {
    const { data } = await api.get('/locations', {
      params: {city_id: cityStore.selectedCity.id}
    })
    locations.value = data
  } catch (err) {
    console.error('error loading locations: ', err)
  } finally {
    loading.value = false
  }
}

watch(
  () => cityStore.selectedCity.id,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      loadLocations()
    }
  }
)

onMounted(loadLocations)

const emit = defineEmits(['select'])

function selectLocation(location){
  emit('select', location)
}

</script>

<template>
 <div class="q-pa-md">
   <div v-if="loading" class="text-center q-my-lg">
     <q-spinner-dots color="primary" size="40px" />
   </div>

   <div v-else class="q-gutter-md">
     <q-card
       v-for="location in locations"
       :key="location.id"
       class="q-hoverable my-card"
       @click="selectLocation(location)"
     >
       <q-img
         :src="location.image || 'https://via.placeholder.com/400x200?text=Нет+фото'"
         :ratio="16/9"
         spinner-color="grey-5"
         class="rounded-borders"
       >
         <div class="absolute-bottom bg-black bg-opacity-50 text-white text-subtitle2 q-pa-sm">
           {{ location.name }}
         </div>
       </q-img>

       <q-card-section>
         <div class="text-caption text-grey">{{ location.description || 'Нет описания' }}</div>
       </q-card-section>

     </q-card>

   </div>

 </div>
</template>

<style scoped>
.my-card {
  cursor: pointer;
}

</style>
