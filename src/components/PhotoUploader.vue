<template>
  <q-card style="min-width: 400px;">
    <q-card-section>
      <div class="text-h6">Загрузить фотографии</div>
    </q-card-section>

    <q-card-section>
      <q-uploader
        label="Перетащите файлы сюда или нажмите для выбора"
        multiple
        accept="image/*"
        @added="onFilesAdded"
        @removed="onFilesRemoved"
        ref="uploader"
        hide-upload-btn
        style="width: 100%;"
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
          <div v-else class="text-center q-pa-md text-grey">
            Нет выбранных фото
          </div>
        </template>
      </q-uploader>
    </q-card-section>

    <q-card-actions align="right">
      <q-btn flat label="Отмена" color="primary" @click="$emit('close')" />
      <q-btn
        label="Сохранить"
        color="primary"
        @click="upload"
        :loading="loading"
        :disable="files.length === 0"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup>
import { ref } from 'vue';
import { api } from 'boot/axios';

const props = defineProps({
  locationId: {
    type: [String, Number],
    required: true,
  },
});

const emit = defineEmits(['close', 'uploaded']);

const uploader = ref(null);
const files = ref([]);
const loading = ref(false);

function onFilesAdded(addedFiles) {
  files.value.push(...addedFiles);
}

function onFilesRemoved(removedFiles) {
  console.log('onFilesRemoved', removedFiles)
  const removedKeys = removedFiles.map(f => f.__key);
  files.value = files.value.filter(f => !removedKeys.includes(f.__key));
}

async function upload() {
  if (files.value.length === 0) return;

  loading.value = true;
  const formData = new FormData();
  files.value.forEach(file => {
    formData.append('photos[]', file);
  });

  try {
    await api.post(`/api/locations/${props.locationId}/photos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    emit('uploaded');
    emit('close');
  } catch (error) {
    console.error('Failed to upload photos:', error);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
