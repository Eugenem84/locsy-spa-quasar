<template>
  <q-page class="relative">

    <div class="absolute-top-right q-pa-sm" style="z-index:1000">
      <q-btn-toggle
        v-model="mapMode"
        push
        rounded
        glossy
        toggle-color="primary"
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

    <div class="absolute-top-left q-pa-sm filters-panel">
      <q-select
        dark
        filled
        multiple
        :style="selectorStyle"
        v-model="locationStore.selectedCategoryIds"
        :options="categoryStore.categories"
        :display-value="categoryDisplayValue"
        option-value="id"
        option-label="name"
        :label="selectorLabel"
        dense
        emit-value
        map-options
        behavior="menu"
        :options-dark="false"
        popup-content-class="select-popup filter-popup"
        @popup-show="() => categoryStore.fetchCategories()"
      >
        <template v-slot:prepend>
          <q-icon name="filter_list" />
        </template>
        <template v-slot:append>
          <q-icon
            v-if="locationStore.selectedCategoryIds.length > 0"
            name="clear"
            class="cursor-pointer"
            @click.stop.prevent="locationStore.selectedCategoryIds = []"
          />
        </template>
        <template v-slot:before-options>
          <q-item clickable @click="toggleSelectAllCategories">
            <q-item-section>
              <q-item-label>{{ selectAllLabel }}</q-item-label>
            </q-item-section>
          </q-item>
        </template>
        <template v-slot:option="{ itemProps, opt, selected, toggleOption }">
          <q-item v-bind="itemProps">
            <q-item-section>
              <q-item-label>{{ opt.name }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-checkbox :model-value="selected" @update:model-value="toggleOption(opt)" />
            </q-item-section>
          </q-item>
        </template>
        <template v-slot:no-option>
          <q-item>
            <q-item-section class="text-grey">
              Категории не найдены
            </q-item-section>
          </q-item>
        </template>
      </q-select>
    </div>

    <YandexMapView v-if="mapMode === 'map'" />
    <ListView v-else />
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCategoryStore } from "stores/category";
import { useLocationStore } from "stores/location";

const mapMode = ref('map')

import YandexMapView from 'components/YandexMapView.vue'
import ListView from "components/ListView.vue";

const categoryStore = useCategoryStore();
const locationStore = useLocationStore();

const selectorStyle = computed(() => {
  const style = {
    'background-color': 'rgb(5,39,71)',
    'border-radius': '20px',
    'transition': 'width 0.3s ease-in-out'
  };
  if (locationStore.selectedCategoryIds.length === 0) {
    style.width = '50px';
  } else {
    style.width = '270px';
  }
  return style;
});

const selectorLabel = computed(() => {
  return locationStore.selectedCategoryIds.length === 0 ? 'Фильтр' : '';
});


// watch(() => route.params.id, id => {
//   if (id) {
//     locationId.value = id
//     dialogOpen.value = true
//   }
//   else {
//     dialogOpen.value = false
//   }
// })

onMounted(async () => {
  await categoryStore.fetchCategories();
});

// "Select All" logic
const areAllCategoriesSelected = computed(() => {
  const allCategoryIds = categoryStore.categories.map(c => c.id);
  return allCategoryIds.length > 0 && locationStore.selectedCategoryIds.length === allCategoryIds.length;
});

const selectAllLabel = computed(() => {
  return areAllCategoriesSelected.value ? 'Снять выделение' : 'Выбрать все';
});

function toggleSelectAllCategories() {
  if (areAllCategoriesSelected.value) {
    locationStore.selectedCategoryIds = [];
  } else {
    locationStore.selectedCategoryIds = categoryStore.categories.map(c => c.id);
  }
}

const categoryDisplayValue = computed(() => {
  const count = locationStore.selectedCategoryIds.length;
  if (count === 0) {
    return null; // Показывает label
  }
  if (count === 1) {
    const category = categoryStore.categories.find(c => c.id === locationStore.selectedCategoryIds[0]);
    return category ? category.name : '1 категория';
  }
  // Правильное склонение для русского языка
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return `${count} категорий выбрано`;
  }
  if (lastDigit === 1) {
    return `${count} категория выбрана`;
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${count} категории выбрано`;
  }
  return `${count} категорий выбрано`;
});
</script>

<style scoped>
.filters-panel {
  z-index: 1000;
  margin-left: 50px;
}

@media (max-width: 599px) {
  .filters-panel {
    margin-left: 0;
    margin-top: 52px;
  }
}
</style>
