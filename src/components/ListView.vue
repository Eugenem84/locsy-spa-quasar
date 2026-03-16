<script setup>
import { ref, watch } from 'vue'
import { api } from 'boot/axios.js'
import { useCityStore } from "stores/city.js";
import { useRouter } from "vue-router";

const cityStore = useCityStore()
const router = useRouter()

const locations = ref([])
const loading = ref(false)

async function loadLocations(cityId) {
  if (!cityId) {
    locations.value = []
    return
  }
  loading.value = true
  try {
    const { data } = await api.get('/api/locations', {
      params: { city_id: cityId }
    })
    locations.value = data
  } catch (err) {
    console.error('error loading locations: ', err)
    locations.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => cityStore.selectedCity?.id,
  (newId) => {
    loadLocations(newId)
  },
  { immediate: true }
)

function selectLocation(location){
  if (location?.id) {
    router.push({ name: 'Location', params: { id: location.id } })
  }
}

</script>

<template>
 <div class="q-pa-md">
   <div v-if="loading" class="text-center q-my-lg">
     <q-spinner-dots color="primary" size="40px" />
   </div>

   <div v-else-if="locations.length > 0" class="q-gutter-y-lg">
     <q-card
       v-for="location in locations"
       :key="location.id"
       class="my-card"
       flat
       bordered
       @click="selectLocation(location)"
     >
       <q-card-section>
         <div class="text-h6 text-weight-medium">{{ location.name }}</div>
       </q-card-section>

       <q-scroll-area horizontal style="height: 160px; width: 100%;">
         <div class="row no-wrap q-gutter-sm q-px-md">
           <!-- Используем full_url из данных о фотографиях -->
           <q-img
             v-for="photo in location.photos"
             :key="photo.id"
             :src="photo.full_url"
             class="rounded-borders"
             spinner-color="grey-5"
             style="width: 250px; height: 150px;"
           >
             <!-- Плейсхолдер на случай, если у локации нет фото -->
             <template v-if="!location.photos || location.photos.length === 0">
               <div class="absolute-full flex flex-center bg-grey-3 text-grey-8">
                 Нет фото
               </div>
             </template>
           </q-img>
         </div>
       </q-scroll-area>

       <q-card-section>
         <p class="text-body2 text-grey-8 ellipsis-3-lines">
           {{ location.description || 'Нет описания.' }}
         </p>
       </q-card-section>
     </q-card>
   </div>

   <div v-else-if="!cityStore.selectedCity" class="text-center text-grey q-my-lg">
     Выберите город, чтобы увидеть список локаций.
   </div>

   <div v-else class="text-center text-grey q-my-lg">
     В этом городе пока нет локаций.
   </div>

 </div>
</template>

<style scoped>
.my-card {
  cursor: pointer;
  transition: box-shadow 0.2s ease-in-out;
}

.my-card:hover {
  box-shadow: 0 1px 5px rgba(0,0,0,0.2), 0 2px 2px rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12);
}

.ellipsis-3-lines {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
