import { watch } from 'vue';
import { useUserAuthStore } from './store';
import { authApi } from './api';

// Lazy-import pages to avoid circular deps at module load time
const AdminPage = () => import('./AdminPage.vue');

export const authPlugin = {
  install(app) {
    // The Pinia store will be auto-registered on first use.
    // We add routes dynamically to the existing router.
    const router = app.config.globalProperties.$router;

    // Admin system page inside the DefaultLayout /admin group
    router.addRoute('DefaultLayout', {
      path: 'system-admin',
      name: 'SystemAdmin',
      component: AdminPage,
      meta: {
        title: '系统管理',
        requiresAuth: true,
        requiresAdmin: true
      }
    });

    // Add navigation guard BEFORE existing guards by inserting first
    router.beforeEach((to, _from, next) => {
      const authStore = useUserAuthStore();
      const publicRoutes = ['/login', '/register'];

      if (!authStore.isLoggedIn && !publicRoutes.includes(to.path)) {
        // Save the intended destination so we can redirect after login
        next({ path: '/login', query: { redirect: to.fullPath } });
      } else if (authStore.isLoggedIn && to.path === '/login') {
        next('/');
      } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
        next('/admin/dashboard');
      } else {
        next();
      }
    });

    // After the app is mounted, initialize auth and set up token sync
    const originalMount = app.mount.bind(app);
    app.mount = function (rootContainer) {
      const mountResult = originalMount(rootContainer);

      // Initialize auth state from saved token
      const authStore = useUserAuthStore();

      authStore.initAuth().then((isLoggedIn) => {
        if (isLoggedIn) {
          loadUserTokens(authStore);
          setupTokenSync(authStore);
          loadUserSettings(authStore);
          setupSettingsSync(authStore);
        }
      });

      // Watch login state changes
      watch(
        () => authStore.isLoggedIn,
        (loggedIn, wasLoggedIn) => {
          if (loggedIn && !wasLoggedIn) {
            // Just logged in: load tokens and settings from backend
            loadUserTokens(authStore);
            setupTokenSync(authStore);
            loadUserSettings(authStore);
            setupSettingsSync(authStore);
          } else if (!loggedIn && wasLoggedIn) {
            // Just logged out: clear sync watchers and local data
            clearTokenSync();
            clearSettingsSync();
            import('@/stores/tokenStore').then(({ gameTokens }) => {
              gameTokens.value = [];
            });
          }
        }
      );

      return mountResult;
    };
  }
};

// ---- Token sync ----

let syncTimer = null;
let tokenSyncWatcher = null;

// ---- Settings sync ----

let settingsSyncTimer = null;
let settingsSyncWatcher = null;

async function loadUserTokens(authStore) {
  if (!authStore.isLoggedIn) return;
  try {
    const { data } = await authApi.getTokens();
    const { gameTokens } = await import('@/stores/tokenStore');
    // Backend is source of truth: always overwrite local tokens on login
    gameTokens.value = Array.isArray(data.tokens) ? data.tokens : [];
  } catch (err) {
    console.warn('[Auth Plugin] Failed to load user tokens from backend:', err.message);
  }
}

async function saveUserTokens(tokens) {
  try {
    await authApi.saveTokens(tokens);
  } catch (err) {
    console.warn('[Auth Plugin] Failed to sync tokens to backend:', err.message);
  }
}

async function setupTokenSync(authStore) {
  // Clean up any existing watcher
  clearTokenSync();

  try {
    const { gameTokens } = await import('@/stores/tokenStore');

    tokenSyncWatcher = watch(
      () => gameTokens.value,
      (tokens) => {
        if (!authStore.isLoggedIn) return;
        clearTimeout(syncTimer);
        syncTimer = setTimeout(() => {
          saveUserTokens(tokens);
        }, 2000);
      },
      { deep: true }
    );
  } catch (err) {
    console.warn('[Auth Plugin] Failed to set up token sync watcher:', err.message);
  }
}

function clearTokenSync() {
  if (tokenSyncWatcher) {
    tokenSyncWatcher();
    tokenSyncWatcher = null;
  }
  clearTimeout(syncTimer);
  syncTimer = null;
}

// ---- Settings sync functions ----

async function loadUserSettings(authStore) {
  if (!authStore.isLoggedIn) return;
  try {
    const { data } = await authApi.getSettings();
    const { batchSettings } = await import('@/composables/useBatchSettings');

    if (data.settings && typeof data.settings === 'object') {
      // Backend is source of truth
      Object.assign(batchSettings, data.settings);
    } else {
      // No backend data yet: migrate from localStorage
      const raw = localStorage.getItem('batchSettings');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          Object.assign(batchSettings, parsed);
          await authApi.saveSettings({ ...batchSettings });
        } catch {
          // Malformed localStorage data: ignore
        }
      }
    }
  } catch (err) {
    console.warn('[Auth Plugin] Failed to load user settings from backend:', err.message);
  }
}

async function saveUserSettings(settings) {
  try {
    await authApi.saveSettings(settings);
  } catch (err) {
    console.warn('[Auth Plugin] Failed to sync settings to backend:', err.message);
  }
}

async function setupSettingsSync(authStore) {
  clearSettingsSync();

  try {
    const { batchSettings } = await import('@/composables/useBatchSettings');

    settingsSyncWatcher = watch(
      () => ({ ...batchSettings }),
      (settings) => {
        if (!authStore.isLoggedIn) return;
        clearTimeout(settingsSyncTimer);
        settingsSyncTimer = setTimeout(() => {
          saveUserSettings(settings);
        }, 2000);
      },
      { deep: true }
    );
  } catch (err) {
    console.warn('[Auth Plugin] Failed to set up settings sync watcher:', err.message);
  }
}

function clearSettingsSync() {
  if (settingsSyncWatcher) {
    settingsSyncWatcher();
    settingsSyncWatcher = null;
  }
  clearTimeout(settingsSyncTimer);
  settingsSyncTimer = null;
}
