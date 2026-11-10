let corePromise;
export function loadGameRuntime() {
  corePromise ||= import(
    /* @vite-ignore */ `${import.meta.env.BASE_URL}game-runtime/core.js?v=20261028.3`
  ).catch((error) => {
    corePromise = undefined;
    throw error;
  });
  return corePromise;
}
