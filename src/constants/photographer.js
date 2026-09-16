// Справочники, общие для форм регистрации и профиля фотографа

export const WORK_TYPES = [
  'Портрет',
  'Свадьба',
  'Love story',
  'Семейная',
  'Детская',
  'Fashion',
  'Репортаж',
  'Предметная',
  'Бизнес',
  'Стрит',
  'Пейзаж',
  'Архитектура'
]

// Статусы модерации локаций
export const LOCATION_STATUS_META = {
  pending: { label: 'На модерации', color: 'warning', icon: 'hourglass_top' },
  approved: { label: 'Опубликовано', color: 'positive', icon: 'check_circle' },
  rejected: { label: 'Отклонено', color: 'negative', icon: 'cancel' }
}

// Статусы модерации фотографий
export const PHOTO_STATUS_META = {
  pending: { label: 'На модерации', color: 'warning', icon: 'hourglass_top' },
  approved: { label: 'Опубликовано', color: 'positive', icon: 'check_circle' },
  rejected: { label: 'Отклонено', color: 'negative', icon: 'cancel' }
}

export function locationStatusMeta(status) {
  return LOCATION_STATUS_META[status] || { label: status || '—', color: 'grey', icon: 'help' }
}

export function photoStatusMeta(status) {
  return PHOTO_STATUS_META[status] || { label: status || '—', color: 'grey', icon: 'help' }
}
