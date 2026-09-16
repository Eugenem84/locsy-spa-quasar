<template>
  <q-card class="uploader-card">
    <q-card-section>
      <div class="text-h6">Добавить фотографии</div>
      <div class="text-body2 text-grey-7">
        До 10 фото за раз, JPEG / PNG / GIF / WebP, до 20 МБ каждое.
      </div>
    </q-card-section>

    <q-card-section class="q-pt-none">
      <q-banner dense class="bg-orange-1 text-orange-9 rounded-borders q-mb-md">
        <template v-slot:avatar><q-icon name="verified_user" /></template>
        Фотографии появятся в галерее локации после проверки модератором.
      </q-banner>

      <q-uploader
        label="Перетащите файлы сюда или нажмите для выбора"
        multiple
        accept="image/*"
        @added="onFilesAdded"
        @removed="onFilesRemoved"
        ref="uploader"
        hide-upload-btn
        style="width: 100%"
      >
        <template v-slot:list="scope">
          <div class="row q-gutter-md q-pa-md" v-if="scope.files.length > 0">
            <div v-for="file in scope.files" :key="file.__key" style="width: 100px">
              <div class="relative-position">
                <q-img :src="file.__img.src" :ratio="1" class="rounded-borders" />
                <q-btn
                  size="sm"
                  flat
                  dense
                  round
                  icon="delete"
                  color="negative"
                  class="absolute-top-right"
                  @click="scope.removeFile(file)"
                />
              </div>
              <div class="ellipsis q-mt-xs text-center" :title="file.name">{{ file.name }}</div>
            </div>
          </div>
          <div v-else class="text-center q-pa-md text-grey">Нет выбранных фото</div>
        </template>
      </q-uploader>
    </q-card-section>

    <q-card-actions align="right">
      <q-btn flat label="Отмена" color="primary" no-caps @click="$emit('close')" />
      <q-btn
        label="Отправить на модерацию"
        color="primary"
        no-caps
        icon="cloud_upload"
        @click="upload"
        :loading="loading"
        :disable="files.length === 0"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'

const props = defineProps({
  locationId: {
    type: [String, Number],
    required: true
  }
})

const emit = defineEmits(['close', 'uploaded'])

const $q = useQuasar()
const uploader = ref(null)
const files = ref([])
const loading = ref(false)
const MAX_FILES = 10

function onFilesAdded(addedFiles) {
  files.value.push(...addedFiles)
}

function onFilesRemoved(removedFiles) {
  const removedKeys = removedFiles.map((f) => f.__key)
  files.value = files.value.filter((f) => !removedKeys.includes(f.__key))
}

async function upload() {
  if (files.value.length === 0) return

  if (files.value.length > MAX_FILES) {
    $q.notify({
      color: 'warning',
      icon: 'warning',
      message: `За раз можно отправить не более ${MAX_FILES} фотографий`
    })
    return
  }

  loading.value = true
  const formData = new FormData()
  files.value.forEach((file) => {
    formData.append('photos[]', file)
  })

  try {
    const { data } = await api.post(`/api/locations/${props.locationId}/photos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    $q.notify({
      color: 'positive',
      icon: 'check',
      message: data?.needs_moderation
        ? 'Фото отправлены на модерацию — появятся в галерее после проверки'
        : 'Фотографии добавлены в галерею'
    })

    emit('uploaded')
    emit('close')
  } catch (error) {
    const responseData = error?.response?.data
    const message = responseData?.errors
      ? Object.values(responseData.errors).flat().join(' ')
      : responseData?.message || 'Не удалось загрузить фотографии'

    $q.notify({ color: 'negative', icon: 'report_problem', message })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.uploader-card {
  width: 100%;
  max-width: 560px;
}

.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
