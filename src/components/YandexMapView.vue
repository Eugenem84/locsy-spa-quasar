<template>
  <YandexMap
    v-model="mapInstance"
    height="92vh"
    width="100%"
    :settings="{
      location: { center: mapCenter, zoom: 12 },
      showScaleInCopyrights: true,
    }"
    :class="{ 'picking-mode': isPickingMode }"
  >
    <!--
      События карты идут не через <YandexMap> (у компонента нет emits click/update),
      а через YandexMapListener из vue-yandex-maps.
    -->
    <YandexMapListener :settings="mapListenerSettings" />
    <YandexMapDefaultSchemeLayer />
    <!--
      Слой объектов нужен ymaps3, чтобы отрисовать маркеры.
      Сами маркеры создаём императивно через ymaps3 (см. syncMarkers):
      компонент <YandexMapMarker> из vue-yandex-maps 2.3.2 после создания маркера
      удаляет его DOM — проверка closest("ymaps") не находит тег "ymaps3",
      которым рендерит карту современный JS API. В итоге маркеров не видно.
    -->
    <YandexMapDefaultFeaturesLayer />
  </YandexMap>

  <!-- Плашка выделенной локации: карта открыта по ссылке на конкретное место.
       Кнопка сбрасывает фокус и возвращает карту к центру города. -->
  <div v-if="focusedLocation && !modalOpen" class="focused-location-wrapper">
    <q-card flat class="focused-location-card">
      <q-card-section class="row items-center no-wrap q-py-sm q-px-md">
        <q-icon name="place" color="primary" size="22px" class="q-mr-sm" />
        <div class="col ellipsis">
          <div class="text-caption text-grey-7">Выделенная локация</div>
          <div class="text-body2 text-weight-medium ellipsis">{{ focusedLocation.name }}</div>
        </div>
        <q-btn
          flat
          dense
          no-caps
          color="primary"
          icon="close"
          label="Сбросить"
          class="q-ml-sm"
          @click="clearLocationFocus()"
        />
      </q-card-section>
    </q-card>
  </div>

  <!-- Location Detail Modal -->
  <div class="location-bottom-sheet-wrapper">
    <q-card v-if="modalOpen"
            class="location-bottom-sheet"
            @click="goToLocation"
    >
      <q-btn
        flat
        dense
        icon="close"
        @click.stop="closeModal"
        class="absolute-top-right q-ma-sm z-top"
      />
      <q-card-section class="text-center">
        <div class="text-h6 q-mb-sm">{{ selectedLocation?.name }}</div>
        <q-scroll-area
          horizontal
          style="height: 200px; max-width: 100%;"
          class="q-mb-md"
        >
          <div class="row no-wrap">
            <div v-for="photo in selectedLocation?.photos" :key="photo.id" class="q-mr-md">
              <!-- Фото показываем целиком: высота фиксирована, ширина — по пропорциям. -->
              <img
                :src="photo.full_url"
                :alt="selectedLocation?.name"
                class="location-thumb"
                loading="lazy"
              />
            </div>
          </div>
        </q-scroll-area>
        <div class="text-grey-14 q-mb-md">{{ selectedLocation?.description}}</div>
      </q-card-section>
      <q-separator />
      <q-card-section v-if="selectedLocationAddress" class="text-center">
        <div class="text-subtitle2 text-grey-8 q-mb-xs">Адрес</div>
        <div class="text-caption text-grey">
          {{ selectedLocationAddress }}
        </div>
      </q-card-section>
    </q-card>
  </div>


  <q-dialog v-model="createLocationDialogOpen" @hide="onDialogHide">
    <CreateLocationForm
      v-if="newLocationCoords"
      :latitude="newLocationCoords[1]"
      :longitude="newLocationCoords[0]"
      @location-created="onLocationCreated"
    />
  </q-dialog>
</template>

<script setup>
import { computed, ref, shallowRef, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useCityStore } from 'stores/city.js'
import { useLocationStore } from "stores/location.js";
import { useAuthStore } from "stores/auth-store";
import { useRoute, useRouter } from "vue-router";
import {
  YandexMap,
  YandexMapDefaultSchemeLayer,
  YandexMapDefaultFeaturesLayer,
  YandexMapListener,
} from 'vue-yandex-maps'
import { debounce, useQuasar } from 'quasar';
import CreateLocationForm from "components/CreateLocationForm.vue";
import { api } from 'boot/axios.js'

const router = useRouter();
const route = useRoute();
const cityStore = useCityStore()
const locationStore = useLocationStore();
const authStore = useAuthStore();
const $q = useQuasar();

// Объект карты ymaps3 (YMap). Компонент <YandexMap> отдаёт его через v-model —
// только у него есть геттеры bounds/center/zoom и метод setLocation.
//
// ВАЖНО: именно shallowRef, а не ref. Обычный ref заворачивает объект в
// реактивный Proxy, а YMap внутри читает приватные поля (#…) — через Proxy это
// падает с «Cannot read private member from an object whose class did not declare it»
// на первом же обращении к map.bounds.
const mapInstance = shallowRef(null);
let mapInitialized = false;
const locations = computed(() => locationStore.locations);
const pickingNotification = ref(null);
const createLocationDialogOpen = ref(false);
const newLocationCoords = ref(null);

const selectedLocation = computed(() => locationStore.selectedLocation);
const selectedLocationAddress = ref('');
const modalOpen = ref(false);
const favorites = ref([]);
// Маркеры, созданные вручную через ymaps3: id локации -> { marker, element }.
const mapMarkers = new Map();

// Локация, открытая по прямой ссылке (?location=<id>): к ней приближаемся
// и подсвечиваем её маркер на карте. null — фокуса нет.
const focusedLocation = ref(null);
// Приближение, с которым показываем локацию из ссылки.
const FOCUS_ZOOM = 16;
// Сброс кликом по карте снимает выделение, не возвращая вид к центру города.
// Флаг доносит это намерение до watcher route.query.location после смены адреса.
let keepMapPositionOnClear = false;


const isPickingMode = computed(() => route.query.picking === 'true');

/** Yandex Maps 3: [долгота, широта]. Номерные координаты приходят из cityStore. */
const mapCenter = computed(() => {
  const coords = cityStore.selectedCity?.coords
  if (coords?.length === 2 && coords.every(Number.isFinite)) {
    return [coords[1], coords[0]]
  }
  return [37.618423, 55.751244]
})

const doFetchLocations = async () => {
  const map = mapInstance.value;
  if (!map) return;
  try {
    // map.bounds в ymaps3 — [[запад, север], [восток, юг]] (левый верх и правый низ).
    // Стор и API (/api/locations/by-bounds) ждут [[широта, долгота], ...].
    const [[west, north], [east, south]] = map.bounds;
    const bounds = [
      [south, west],
      [north, east],
    ];
    await locationStore.fetchLocationsByBounds(bounds);
  } catch (e) {
    console.error("Failed to fetch locations by bounds:", e);
  }
};

const fetchLocations = debounce(doFetchLocations, 300);

// Слушатель событий карты: в vue-yandex-maps события подписываются
// через YandexMapListener, а не через emits компонента <YandexMap>.
const mapListenerSettings = {
  onClick: handleMapClick,
  onUpdate: fetchLocations,
};

async function fetchFavorites() {
  if (!authStore.isLoggedIn) return;
  try {
    const response = await api.get('/api/favorites');
    favorites.value = response.data.map(fav => fav.id);
  } catch (error) {
    console.error('Failed to fetch favorites:', error);
  }
}

async function initializeMap() {
  // Карта считается готовой, когда пришёл её объект (v-model). Один раз на монтирование.
  if (mapInitialized || !mapInstance.value) return;
  mapInitialized = true;

  await fetchFavorites();
  // Если карту открыли по ссылке ?location=<id>, сначала центрируемся на локации,
  // чтобы её маркер точно попал в область запроса видимых локаций.
  await applyFocusFromQuery();
  await doFetchLocations();
  syncMarkers();

  // Быстрая диагностика в консоли браузера: сколько локаций пришло и сколько маркеров нарисовано.
  if (import.meta.env.DEV) {
    console.debug(
      '[getlocsy] локаций на карте: %d, маркеров отрисовано: %d',
      locations.value.length,
      mapMarkers.size
    );
  }
}

// Компонент <YandexMap> не эмитит событие ready — объект карты он отдаёт через
// v-model сразу после new ymaps3.YMap(...). Этот момент и есть готовность карты.
watch(mapInstance, (map) => {
  if (map) initializeMap();
});

/**
 * Центрирование карты на локации из query-параметра ?location=<id>.
 *
 * Так работает ссылка «Показать на карте» со страницы локации: карта
 * открывается на нужном месте с приближением, а маркер локации подсвечивается.
 * Координаты берём из API, поэтому ссылку можно открыть и перезагрузить.
 *
 * @returns {Promise<boolean>} true, если фокус был установлен.
 */
async function applyFocusFromQuery() {
  const map = mapInstance.value;
  const id = Number(route.query.location);
  if (!map || !Number.isFinite(id) || id <= 0) return false;

  // Уже сфокусированы на этой локации — повторно карту не двигаем.
  if (String(focusedLocation.value?.id) === String(id)) return false;

  try {
    const { data } = await api.get(`/api/location/${id}`);
    const longitude = Number(data.longitude);
    const latitude = Number(data.latitude);
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return false;

    focusedLocation.value = { id: data.id, name: data.name };
    // duration: 0 — без анимации, чтобы bounds обновились сразу и попали в запрос локаций.
    await map.setLocation({ center: [longitude, latitude], zoom: FOCUS_ZOOM, duration: 0 });
    return true;
  } catch (error) {
    console.error('Failed to focus location from query:', error);
    return false;
  }
}

/**
 * Сброс фокуса: снимаем подсветку маркера и перезапрашиваем локации.
 *
 * @param {{ recenter?: boolean }} options
 *   recenter=true — вернуть карту к центру выбранного города (кнопка «Сбросить»);
 *   recenter=false — оставить текущий вид (клик по пустому месту карты).
 */
async function resetLocationFocus({ recenter = true } = {}) {
  if (!focusedLocation.value) return;

  focusedLocation.value = null;

  const map = mapInstance.value;
  const coords = cityStore.selectedCity?.coords;
  if (recenter && map && coords?.length === 2) {
    await map.setLocation({ center: [coords[1], coords[0]], zoom: 12, duration: 0 });
  }

  await doFetchLocations();
}

/**
 * Сброс выделения: убираем ?location=<id> из адреса.
 * Дальше watcher на route.query.location снимет подсветку маркера.
 *
 * @param {{ recenter?: boolean }} options recenter=false (клик по карте)
 *   оставляет вид на месте, recenter=true возвращает карту к городу.
 */
function clearLocationFocus({ recenter = true } = {}) {
  if (route.query.location === undefined) {
    resetLocationFocus({ recenter });
    return;
  }

  // Запоминаем намерение до смены адреса: watcher сработает уже после replace.
  keepMapPositionOnClear = !recenter;

  const query = { ...route.query };
  delete query.location;
  router.replace({ path: '/', query });
}

// Ссылку вида /?location=<id> можно открыть и переключить без перезагрузки
// страницы (например, вернувшись со страницы локации на карту).
watch(() => route.query.location, async (value) => {
  if (value) {
    if (await applyFocusFromQuery()) {
      await doFetchLocations();
    }
  } else {
    const recenter = !keepMapPositionOnClear;
    keepMapPositionOnClear = false;
    await resetLocationFocus({ recenter });
  }
});

// Список локаций обновился (первая загрузка или смена города) — перерисовываем маркеры.
watch(locations, () => syncMarkers());

// «Избранное» влияет на цвет пина — обновляем вид, не пересоздавая маркеры.
watch(favorites, () => {
  mapMarkers.forEach(({ element }, id) => {
    const location = locations.value.find((item) => item.id === id);
    if (location) applyMarkerAppearance(location, element, false);
  });
});

onBeforeUnmount(() => removeAllMarkers());

watch(isPickingMode, (isPicking) => {
  if (isPicking) {
    document.addEventListener('keydown', handleEscKey);
    showPickingNotification();
  } else {
    document.removeEventListener('keydown', handleEscKey);
    if (pickingNotification.value) {
      pickingNotification.value();
      pickingNotification.value = null;
    }
  }
});

function showPickingNotification() {
  pickingNotification.value = $q.notify({
    message: 'Выберите место на карте для создания новой локации.',
    color: 'primary',
    icon: 'place',
    position: 'top',
    timeout: 0,
    actions: [
      { label: 'Отмена', color: 'white', handler: () => cancelPickingMode() }
    ]
  });
}

function cancelPickingMode() {
  router.push({ path: '/' });
}

function handleEscKey(event) {
  if (event.key === 'Escape') {
    cancelPickingMode();
  }
}

/**
 * Клик по карте. Обработчик вешается через YandexMapListener, поэтому получает
 * аргументы ymaps3: сущность под курсором и событие с готовыми координатами.
 *
 * @param {object|undefined} object Сущность карты под курсором (или undefined).
 * @param {{ coordinates: [number, number] }} event Координаты клика: [долгота, широта].
 */
function handleMapClick(object, event) {
  if (!isPickingMode.value) {
    // object !== undefined — клик попал в маркер: его обрабатывает сам маркер
    // (см. createMarkerElement), выделение при этом не сбрасываем.
    if (object || !focusedLocation.value) return;

    // Клик по пустому месту карты сбрасывает выделение, но не двигает карту.
    clearLocationFocus({ recenter: false });
    return;
  }

  if (pickingNotification.value) {
    pickingNotification.value();
    pickingNotification.value = null;
  }

  const coords = event?.coordinates;
  if (Array.isArray(coords) && coords.length === 2) {
    newLocationCoords.value = [...coords];
    nextTick(() => {
      createLocationDialogOpen.value = true;
    });
  }
}

function onDialogHide() {
  if (isPickingMode.value) {
    router.push({ path: '/' });
  }
  // Сбрасываем координаты после закрытия диалога
  newLocationCoords.value = null;
}

function onLocationCreated() {
  createLocationDialogOpen.value = false;
}

onMounted(() => {
  if (isPickingMode.value) {
    document.addEventListener('keydown', handleEscKey);
    showPickingNotification();
  }
});

watch(() => authStore.isLoggedIn, (isLoggedIn) => {
  if (isLoggedIn) {
    fetchFavorites();
  } else {
    favorites.value = [];
  }
});

watch(selectedLocation, (newVal) => {
  modalOpen.value = !!newVal;

  // Клик по маркеру выделяет его, пока открыта карточка локации: обновляем вид
  // маркеров, чтобы подсветка встала на выбранную локацию и снялась с прежней.
  mapMarkers.forEach(({ element }, id) => {
    const location = locations.value.find((item) => item.id === id);
    if (location) applyMarkerAppearance(location, element, false);
  });
});

async function fetchAddress(lat, lon) {
  try {
    selectedLocationAddress.value = 'Загрузка адреса...';
    const apiKey = process.env.YANDEX_MAPS_API_KEY;
    const response = await api.get(`https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&format=json&geocode=${lon},${lat}`);
    const data = response.data;
    const geoObject = data.response.GeoObjectCollection.featureMember[0]?.GeoObject;
    if (geoObject) {
      selectedLocationAddress.value = geoObject.metaDataProperty.GeocoderMetaData.text;
    } else {
      selectedLocationAddress.value = 'Адрес не найден';
    }
  } catch (error) {
    console.error('There was a problem with the fetch operation:', error);
    selectedLocationAddress.value = 'Не удалось загрузить адрес';
  }
}

function openLocationModal(loc) {
  if (isPickingMode.value) {
    return;
  }
  locationStore.selectLocation(loc);
  fetchAddress(loc.latitude, loc.longitude);
}

function closeModal() {
  locationStore.selectLocation(null);
  selectedLocationAddress.value = '';
}

function goToLocation() {
  if (selectedLocation.value?.id) {
    router.push({ name: 'Location', params: { id: selectedLocation.value.id } });
  }
}

const defaultMarkerColor = '#1861b1';
const favoriteMarkerColor = '#F97316';
// Цвет маркера локации, открытой по прямой ссылке (?location=<id>).
const focusedMarkerColor = '#e11d48';

function getMarkerColor(location) {
  return favorites.value.includes(location.id) ? favoriteMarkerColor : defaultMarkerColor;
}

// Путь иконки пина — тот же, что раньше был в разметке маркера.
const MARKER_ICON_PATH =
  'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z';

/**
 * Внешний вид маркера: размер зависит от выделения и наведения, цвет — от «избранного».
 *
 * Выделенным считается маркер локации, открытой в карточке (клик по маркеру),
 * а также локации из ссылки «Показать на карте» (?location=<id>).
 */
function applyMarkerAppearance(location, element, hovered) {
  const isFocused = String(location.id) === String(focusedLocation.value?.id);
  // Маркер выделяем, только пока открыта карточка локации: если её закрыли,
  // подсветка снимается (значение в сторе при этом может остаться прежним).
  const isSelected =
    modalOpen.value && String(location.id) === String(selectedLocation.value?.id);
  const isHighlighted = isFocused || isSelected;

  const size = isHighlighted ? 52 : hovered ? 48 : 36;
  element.style.width = `${size}px`;
  element.style.height = `${size}px`;
  element.style.transform = `translate(-${size / 2}px, -${size}px)`;

  const icon = element.querySelector('svg');
  if (icon) icon.setAttribute('fill', isHighlighted ? focusedMarkerColor : getMarkerColor(location));

  // Подсветка выбранного/фокусного маркера: увеличенный пин, пульсация
  // и постоянная подсказка с названием.
  element.classList.toggle('is-focused', isFocused);
  element.classList.toggle('is-selected', isSelected);
  const tooltip = element.querySelector('.tooltip');
  if (tooltip) tooltip.classList.toggle('is-visible', isHighlighted || hovered);
}

/**
 * DOM маркера: пин + подсказка с названием локации.
 *
 * Маркеры создаём императивно через ymaps3, потому что компонент
 * <YandexMapMarker> из vue-yandex-maps 2.3.2 после создания маркера удаляет его
 * DOM: он проверяет closest("ymaps"), а современный JS API рендерит тег
 * "ymaps3". В итоге через этот компонент маркеры на карте не отображаются.
 */
function createMarkerElement(location) {
  const element = document.createElement('div');
  element.className = 'custom-marker';
  element.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${MARKER_ICON_PATH}"></path></svg><div class="tooltip"></div>`;

  const tooltip = element.querySelector('.tooltip');
  if (tooltip) tooltip.textContent = location.name;

  element.addEventListener('click', (event) => {
    event.stopPropagation();
    openLocationModal(location);
  });
  element.addEventListener('mouseenter', () => applyMarkerAppearance(location, element, true));
  element.addEventListener('mouseleave', () => applyMarkerAppearance(location, element, false));

  applyMarkerAppearance(location, element, false);
  return element;
}

function removeAllMarkers() {
  const map = mapInstance.value;

  mapMarkers.forEach(({ marker, element }) => {
    if (map) {
      try {
        map.removeChild(marker);
      } catch {
        // карта уже уничтожена (уход со страницы) — чистим только DOM
      }
    }
    element.remove();
  });

  mapMarkers.clear();
}

/** Перерисовать маркеры по текущему списку локаций. */
function syncMarkers() {
  const map = mapInstance.value;
  const ymaps3 = window.ymaps3;
  if (!map || !ymaps3?.YMapMarker) return;

  removeAllMarkers();

  locations.value.forEach((location) => {
    const coordinates = [Number(location.longitude), Number(location.latitude)];
    if (!coordinates.every(Number.isFinite)) return;

    const element = createMarkerElement(location);
    const marker = new ymaps3.YMapMarker({ coordinates }, element);
    map.addChild(marker);
    mapMarkers.set(location.id, { marker, element });
  });
}


watch(() => cityStore.selectedCity, (newCity) => {
  // Пока открыта ссылка на конкретную локацию (?location=<id>), смена города
  // не должна сбивать приближение — пользователь смотрит именно это место.
  if (focusedLocation.value) return;

  // setLocation есть у объекта YMap (ymaps3), а не у компонента карты.
  if (newCity?.coords?.length === 2 && mapInstance.value) {
    mapInstance.value.setLocation({
      center: [newCity.coords[1], newCity.coords[0]],
      zoom: 12
    });
  }
});

watch(() => locationStore.selectedCategoryIds, () => {
  doFetchLocations();
}, { deep: true });

</script>

<style scoped>
.picking-mode {
  cursor: crosshair;
}

.location-bottom-sheet-wrapper {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  pointer-events: none;
}

/* Миниатюра в карточке локации: без обрезки и скругления углов. */
.location-thumb {
  height: 200px;
  width: auto;
  max-width: none;
  display: block;
}

.location-bottom-sheet {
  pointer-events: all;
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

/* Плашка выделенной локации (ссылка ?location=<id>): подсказка о фокусе
   и кнопка сброса. Скрывается, когда открыта карточка локации. */
.focused-location-wrapper {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 998;
  width: min(92%, 420px);
  pointer-events: none;
}

.focused-location-card {
  pointer-events: all;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

</style>

<!--
  Стили маркеров — БЕЗ scoped: элементы создаются императивно
  (см. createMarkerElement) и не попадают в область видимости компонента.
-->
<style>
.custom-marker {
    position: absolute;
    left: 0;
    top: 0;
    transition: width 0.3s ease, height 0.3s ease, transform 0.3s ease;
    will-change: transform;
}

.custom-marker svg {
    width: 100%;
    height: 100%;
}

.tooltip {
    position: absolute;
    top: -25px;
    left: 50%;
    transform: translateX(-50%);
    background-color: white;
    padding: 5px 10px;
    border-radius: 5px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.3s;
    pointer-events: none;
}

.custom-marker:hover .tooltip {
    opacity: 1;
}

/* Маркер локации из ссылки «Показать на карте» (?location=<id>) и маркер,
   выбранный кликом (открыта карточка локации): пульсирующий ореол у основания
   пина и всегда видимая подсказка с названием. */
.custom-marker.is-focused::after,
.custom-marker.is-selected::after {
    content: '';
    position: absolute;
    left: 50%;
    bottom: 0;
    width: 16px;
    height: 16px;
    margin: 0 0 -8px -8px;
    border-radius: 50%;
    background: rgba(225, 29, 72, 0.45);
    animation: focused-marker-pulse 1.6s ease-out infinite;
    pointer-events: none;
}

@keyframes focused-marker-pulse {
    0%   { box-shadow: 0 0 0 0 rgba(225, 29, 72, 0.55); }
    70%  { box-shadow: 0 0 0 26px rgba(225, 29, 72, 0); }
    100% { box-shadow: 0 0 0 0 rgba(225, 29, 72, 0); }
}

.custom-marker .tooltip.is-visible {
    opacity: 1;
}
</style>
