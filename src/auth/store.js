import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi } from './api';

export const useUserAuthStore = defineStore('userAuth', () => {
  // Restore currentUser from localStorage so isLoggedIn is true immediately on page refresh
  const savedUser = localStorage.getItem('auth_user');
  const currentUser = ref(savedUser ? JSON.parse(savedUser) : null);
  const authToken = ref(localStorage.getItem('auth_token') || null);
  const isAuthLoading = ref(false);

  const isLoggedIn = computed(() => !!authToken.value && !!currentUser.value);
  const isAdmin = computed(() => currentUser.value?.is_admin === true);

  function setToken(token) {
    authToken.value = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  function setUser(user) {
    currentUser.value = user;
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('auth_user');
    }
  }

  async function login(username, password) {
    isAuthLoading.value = true;
    try {
      const { data } = await authApi.login(username, password);
      setToken(data.token);
      setUser(data.user);
      return { ok: true, user: data.user };
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Login failed';
      return { ok: false, error: message };
    } finally {
      isAuthLoading.value = false;
    }
  }

  async function register(username, password, invite_code) {
    isAuthLoading.value = true;
    try {
      const { data } = await authApi.register(username, password, invite_code);
      setToken(data.token);
      setUser(data.user);
      return { ok: true, user: data.user };
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Registration failed';
      return { ok: false, error: message };
    } finally {
      isAuthLoading.value = false;
    }
  }

  async function logout() {
    isAuthLoading.value = true;
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors - clear local state regardless
    } finally {
      isAuthLoading.value = false;
    }
    setToken(null);
    setUser(null);
  }

  async function initAuth() {
    const savedToken = localStorage.getItem('auth_token');
    if (!savedToken) {
      return false;
    }

    // Validate token with backend in background
    isAuthLoading.value = true;
    try {
      const { data } = await authApi.me();
      setUser(data); // refresh persisted user info
      authToken.value = savedToken;
      return true;
    } catch (err) {
      if (err.response?.status === 401) {
        // Token expired or invalid
        setToken(null);
        setUser(null);
      }
      // Network errors: keep existing cached state (currentUser already restored from localStorage)
      return !!currentUser.value;
    } finally {
      isAuthLoading.value = false;
    }
  }

  return {
    currentUser,
    authToken,
    isAuthLoading,
    isLoggedIn,
    isAdmin,
    login,
    register,
    logout,
    initAuth,
    setUser
  };
});
