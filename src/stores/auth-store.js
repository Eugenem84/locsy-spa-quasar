import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from 'boot/axios'; // Импортируем настроенный экземпляр axios

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null);

  // Getters
  const isLoggedIn = computed(() => !!user.value);
  const userName = computed(() => {
    if (user.value?.photographer_profile?.display_name) {
      return user.value.photographer_profile.display_name;
    }
    return user.value?.name;
  });
  const isPhotographer = computed(() => !!user.value?.is_photographer);
  const isEmailVerified = computed(() => !!user.value?.email_verified_at);

  // Actions
  function setUser(newUser) {
    user.value = newUser;
    console.log('User object set in store:', user.value); // Added for debugging
  }

  function clearUser() {
    user.value = null;
    // Также очищаем токен из localStorage
    localStorage.removeItem('access_token');
    // Удаляем заголовок Authorization из axios по умолчанию
    delete api.defaults.headers.common['Authorization'];
  }

  function logApiError(context, error) {
    console.error(`[AuthStore] ${context}`, {
      message: error?.message,
      status: error?.response?.status,
      url: error?.config?.url,
      method: error?.config?.method,
      response: error?.response?.data,
    });
  }

  /**
   * Устанавливает токен аутентификации в localStorage и в заголовки axios.
   * @param {string|null} token - Токен для установки. Если null, токен будет удален.
   */
  function setAuthToken(token) {
    if (token) {
      localStorage.setItem('access_token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      clearUser(); // Если токен не предоставлен, очищаем пользователя и токен
    }
  }

  async function getCsrfCookie() {
    try {
      await api.get('/sanctum/csrf-cookie');
    } catch (error) {
      logApiError('Failed to get CSRF cookie', error);
      throw error;
    }
  }

  async function fetchUser() {
    // Перед запросом пользователя, убедимся, что токен установлен в заголовках axios
    // Это особенно важно при перезагрузке страницы, когда store инициализируется заново
    const token = localStorage.getItem('access_token');
    if (token && !api.defaults.headers.common['Authorization']) {
      setAuthToken(token); // Устанавливаем токен в заголовки axios, если он есть в localStorage, но не установлен
    }

    // Запрашиваем CSRF-куку, если она нужна для stateful-аутентификации
    await getCsrfCookie();
    try {
      const { data } = await api.get('/api/user');
      setUser(data);
    } catch (error) {
      logApiError('Failed to fetch user', error);
      clearUser(); // Очищаем пользователя и токен, если запрос не удался (например, 401)
    }
  }

  async function handleLogout() {
    try {
      await getCsrfCookie();
      await api.post('/api/logout');
    } catch (error) {
      logApiError('Failed to logout', error);
    } finally {
      clearUser(); // Всегда очищаем пользователя и токен при выходе
    }
  }

  async function updateUserCity(cityId) {
    try {
      const { data } = await api.put('/api/user/city', { city_id: cityId });
      setUser(data.user);
    } catch (error) {
      logApiError('Failed to update user city', error);
    }
  }

  async function uploadAvatar(file) {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const { data } = await api.post('/api/user/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setUser(data.user); // Assuming the backend returns the updated user object
    } catch (error) {
      logApiError('Failed to upload avatar', error);
      throw error; // Re-throw to be handled by the component
    }
  }

  /**
   * Регистрация. Роль ('user' | 'photographer') определяет, создаётся ли
   * сразу профиль фотографа с портфолио.
   */
  async function register(payload) {
    await getCsrfCookie();
    const { data } = await api.post('/api/register', payload);

    if (data?.access_token) {
      setAuthToken(data.access_token);
    }
    if (data?.user) {
      setUser(data.user);
    } else {
      await fetchUser();
    }

    return data;
  }

  /**
   * Повторная отправка письма со ссылкой на подтверждение почты.
   */
  async function resendVerificationEmail() {
    const { data } = await api.post('/api/email/verification-notification');
    return data;
  }

  /**
   * Сохранение профиля фотографа (в том числе апгрейд из обычного пользователя).
   */
  async function updatePhotographerProfile(payload) {
    const { data } = await api.put('/api/user/photographer-profile', payload);
    if (data?.user) {
      setUser(data.user);
    }
    return data;
  }

  /**
   * Мои локации со статусом модерации.
   */
  async function fetchMyLocations() {
    const { data } = await api.get('/api/user/locations');
    return data;
  }

  /**
   * Мои фотографии со статусом модерации и причиной отказа.
   */
  async function fetchMyPhotos() {
    const { data } = await api.get('/api/user/photos');
    return data;
  }

  /**
   * Удаление своей фотографии. Бэкенд разрешает удалять только свои снимки,
   * чужой запрос вернёт 403.
   */
  async function deletePhoto(photoId) {
    try {
      await api.delete(`/api/photos/${photoId}`);
    } catch (error) {
      logApiError('Failed to delete photo', error);
      throw error;
    }
  }

  /**
   * Удаление аккаунта. Подтверждается текущим паролем; бэкенд удаляет
   * аватар, фотографии и токены. После успеха сбрасываем пользователя
   * и токен на клиенте.
   */
  async function deleteAccount(password) {
    try {
      await api.delete('/api/user', { data: { password } });
    } catch (error) {
      logApiError('Failed to delete account', error);
      throw error;
    }
    clearUser();
  }

  // При инициализации хранилища, пытаемся загрузить токен из localStorage
  // и установить его в заголовки axios
  const initialToken = localStorage.getItem('access_token');
  if (initialToken) {
    setAuthToken(initialToken);
  }

  return {
    user,
    isLoggedIn,
    userName,
    isPhotographer,
    isEmailVerified,
    setUser,
    clearUser,
    setAuthToken, // Экспортируем новое действие
    getCsrfCookie,
    fetchUser,
    handleLogout,
    updateUserCity,
    uploadAvatar,
    register,
    resendVerificationEmail,
    updatePhotographerProfile,
    fetchMyLocations,
    fetchMyPhotos,
    deletePhoto,
    deleteAccount,
  };
});
