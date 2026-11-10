import { useLocalStorage } from "@vueuse/core";
import { claimGameLease, removeGameLease, renewGameLease } from "./gameLease";

const KEY = "xyzw_linkGameReservations";
const locks = new Map();
export const gameReservations = useLocalStorage(
  KEY,
  {},
  { flush: "sync", writeDefaults: false },
);

function read() {
  const value = JSON.parse(localStorage.getItem(KEY) || "{}");
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function write(value) {
  // Read and write synchronously so independent account updates don't overwrite each other.
  localStorage.setItem(KEY, JSON.stringify(value));
  gameReservations.value = value;
}

export function isGameTokenRunning(tokenId) {
  try {
    return Number(read()[tokenId]?.expiresAt) > Date.now();
  } catch {
    return Number(gameReservations.value[tokenId]?.expiresAt) > Date.now();
  }
}

export async function acquireGameToken(tokenId, owner, identity) {
  const claim = () => write(claimGameLease(read(), tokenId, owner, identity));
  try {
    if (navigator.locks?.request) {
      await new Promise((resolve, reject) => {
        navigator.locks
          .request(
            `xyzw-link-game:${identity}`,
            { ifAvailable: true },
            (lock) => {
              if (!lock) {
                reject(new Error("该角色已在其他游戏窗口运行"));
                return;
              }
              try {
                claim();
              } catch (error) {
                reject(error);
                return;
              }
              // Keep the native lock until the window is stopped, even in background tabs.
              return new Promise((release) => {
                locks.set(`${tokenId}:${owner}`, release);
                resolve();
              });
            },
          )
          .catch(reject);
      });
    } else {
      // HTTP IP deployments don't expose Web Locks. Let simultaneous claims settle.
      claim();
      await new Promise((resolve) => setTimeout(resolve, 120));
      if (read()[tokenId]?.owner !== owner)
        throw new Error("账号已被其他窗口占用，请稍后重试");
    }
  } catch (error) {
    releaseGameToken(tokenId, owner);
    throw error;
  }
}

export function refreshGameToken(tokenId, owner) {
  try {
    const next = renewGameLease(read(), tokenId, owner);
    if (!next) return false;
    write(next);
    return true;
  } catch {
    return false;
  }
}

export function releaseGameToken(tokenId, owner) {
  if (!owner) return;
  try {
    const previous = read();
    const next = removeGameLease(previous, tokenId, owner);
    if (next !== previous) write(next);
  } catch {
    /* Native locks still need releasing when storage becomes unavailable. */
  } finally {
    const key = `${tokenId}:${owner}`;
    locks.get(key)?.();
    locks.delete(key);
  }
}
