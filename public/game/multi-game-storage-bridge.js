(function initializeMultiGameStorageBridge(root) {
  "use strict";

  const SCOPE_PATTERN = /^mg-[a-f0-9]{32}$/;

  function validateScope(scope) {
    return SCOPE_PATTERN.test(String(scope || ""));
  }

  function createScopedStorageAdapter(backing, scope) {
    if (!validateScope(scope)) throw new Error("Invalid MultiGame scope");

    const prefix = `multi-game:${scope}:`;
    const scopedKeys = () => {
      const keys = [];
      for (let index = 0; index < backing.length; index += 1) {
        const key = backing.key(index);
        if (key?.startsWith(prefix)) keys.push(key.slice(prefix.length));
      }
      return keys;
    };
    const normalizeKey = (key) => {
      const value = String(key);
      if (value.startsWith("multi-game:")) {
        throw new Error("Nested MultiGame scope is not allowed");
      }
      return value;
    };

    return {
      get length() {
        return scopedKeys().length;
      },
      key(index) {
        return scopedKeys()[Number(index)] ?? null;
      },
      getItem(key) {
        return backing.getItem(prefix + normalizeKey(key));
      },
      setItem(key, value) {
        backing.setItem(prefix + normalizeKey(key), String(value));
      },
      removeItem(key) {
        backing.removeItem(prefix + normalizeKey(key));
      },
      clear() {
        for (const key of scopedKeys()) backing.removeItem(prefix + key);
      },
    };
  }

  function createScopedStorageProxy(prototype, scoped) {
    const target = Object.create(prototype);

    return new Proxy(target, {
      get(proxyTarget, property, receiver) {
        if (
          typeof property === "symbol" ||
          Reflect.has(proxyTarget, property)
        ) {
          return Reflect.get(proxyTarget, property, receiver);
        }

        const value = scoped.getItem(property);
        return value === null ? undefined : value;
      },
      set(proxyTarget, property, value) {
        if (
          typeof property !== "string" ||
          Reflect.has(proxyTarget, property)
        ) {
          return false;
        }

        scoped.setItem(property, value);
        return true;
      },
      deleteProperty(proxyTarget, property) {
        if (
          typeof property !== "string" ||
          Reflect.has(proxyTarget, property)
        ) {
          return true;
        }

        scoped.removeItem(property);
        return true;
      },
      defineProperty(proxyTarget, property, descriptor) {
        if (
          typeof property !== "string" ||
          Reflect.has(proxyTarget, property) ||
          descriptor.configurable !== true ||
          !("value" in descriptor) ||
          "get" in descriptor ||
          "set" in descriptor
        ) {
          return false;
        }

        scoped.setItem(property, descriptor.value);
        return true;
      },
      getOwnPropertyDescriptor(_proxyTarget, property) {
        if (typeof property !== "string") return undefined;
        const value = scoped.getItem(property);
        if (value === null) return undefined;
        return {
          configurable: true,
          enumerable: true,
          writable: true,
          value,
        };
      },
      has(proxyTarget, property) {
        if (
          typeof property === "symbol" ||
          Reflect.has(proxyTarget, property)
        ) {
          return true;
        }
        return scoped.getItem(property) !== null;
      },
      ownKeys() {
        return Array.from({ length: scoped.length }, (_, index) =>
          scoped.key(index),
        ).filter((key) => key !== null);
      },
      preventExtensions() {
        return false;
      },
    });
  }

  function install(win, scope) {
    if (!validateScope(scope)) throw new Error("Invalid MultiGame scope");
    if (win.__MULTI_GAME_STORAGE_SCOPE__) {
      throw new Error("MultiGame storage bridge already installed");
    }

    const rawLocalStorage = win.localStorage;
    const prototype = win.Storage?.prototype;
    const ownsLocalStorage = Object.prototype.hasOwnProperty.call(
      win,
      "localStorage",
    );
    const localStorageDescriptor = ownsLocalStorage
      ? Object.getOwnPropertyDescriptor(win, "localStorage")
      : undefined;
    const methodNames = ["getItem", "setItem", "removeItem", "key", "clear"];
    const descriptors = {};
    if (prototype) {
      for (const name of [...methodNames, "length"]) {
        descriptors[name] = Object.getOwnPropertyDescriptor(prototype, name);
      }
    }
    const lengthDescriptor = descriptors.length;
    const native = {
      getItem: descriptors.getItem?.value,
      setItem: descriptors.setItem?.value,
      removeItem: descriptors.removeItem?.value,
      key: descriptors.key?.value,
      clear: descriptors.clear?.value,
      getLength: lengthDescriptor?.get,
    };

    if (
      !prototype ||
      (localStorageDescriptor && !localStorageDescriptor.configurable) ||
      (!localStorageDescriptor && !Object.isExtensible(win)) ||
      [...methodNames, "length"].some(
        (name) => !descriptors[name]?.configurable,
      ) ||
      Object.values(native).some((member) => typeof member !== "function")
    ) {
      throw new Error("MultiGame storage bridge is not supported");
    }

    const backing = {
      get length() {
        return native.getLength.call(rawLocalStorage);
      },
      key(index) {
        return native.key.call(rawLocalStorage, index);
      },
      getItem(key) {
        return native.getItem.call(rawLocalStorage, key);
      },
      setItem(key, value) {
        native.setItem.call(rawLocalStorage, key, value);
      },
      removeItem(key) {
        native.removeItem.call(rawLocalStorage, key);
      },
    };
    const scoped = createScopedStorageAdapter(backing, scope);
    let scopedLocalStorage;

    try {
      Object.defineProperties(prototype, {
        getItem: {
          configurable: true,
          writable: true,
          value(key) {
            return this === rawLocalStorage || this === scopedLocalStorage
              ? scoped.getItem(key)
              : native.getItem.call(this, key);
          },
        },
        setItem: {
          configurable: true,
          writable: true,
          value(key, value) {
            return this === rawLocalStorage || this === scopedLocalStorage
              ? scoped.setItem(key, value)
              : native.setItem.call(this, key, value);
          },
        },
        removeItem: {
          configurable: true,
          writable: true,
          value(key) {
            return this === rawLocalStorage || this === scopedLocalStorage
              ? scoped.removeItem(key)
              : native.removeItem.call(this, key);
          },
        },
        key: {
          configurable: true,
          writable: true,
          value(index) {
            return this === rawLocalStorage || this === scopedLocalStorage
              ? scoped.key(index)
              : native.key.call(this, index);
          },
        },
        clear: {
          configurable: true,
          writable: true,
          value() {
            return this === rawLocalStorage || this === scopedLocalStorage
              ? scoped.clear()
              : native.clear.call(this);
          },
        },
        length: {
          configurable: true,
          get() {
            return this === rawLocalStorage || this === scopedLocalStorage
              ? scoped.length
              : native.getLength.call(this);
          },
        },
      });

      scopedLocalStorage = createScopedStorageProxy(prototype, scoped);
      Object.defineProperty(win, "localStorage", {
        configurable: true,
        enumerable: localStorageDescriptor?.enumerable ?? true,
        get() {
          return scopedLocalStorage;
        },
      });
    } catch (error) {
      try {
        Object.defineProperties(prototype, descriptors);
      } catch {
        // The caller will fail closed and never load the game runtime.
      }
      try {
        if (ownsLocalStorage) {
          Object.defineProperty(win, "localStorage", localStorageDescriptor);
        } else {
          delete win.localStorage;
        }
      } catch {
        // The caller will fail closed and never load the game runtime.
      }
      throw new Error("MultiGame storage bridge is not supported", {
        cause: error,
      });
    }

    win.__MULTI_GAME_STORAGE_SCOPE__ = scope;
    return scoped;
  }

  const api = { validateScope, createScopedStorageAdapter, install };
  root.MultiGameStorageBridge = api;

  if (root.window === root && root.document) {
    const params = new URLSearchParams(root.location.search);
    const scopes = params.getAll("scope");
    const binIds = params.getAll("bin_id");
    const scope = scopes.length === 1 ? scopes[0] : "";
    const binId = binIds.length === 1 ? binIds[0] : "";

    try {
      if (!binId) throw new Error("Missing MultiGame account");
      if (!validateScope(scope)) throw new Error("Invalid MultiGame scope");
      const rawPrefix = `multi-game:${scope}:`;
      const rawCurrentBinId = root.localStorage.getItem(
        `${rawPrefix}current_bin_id`,
      );
      const rawBinData = root.localStorage.getItem(
        `${rawPrefix}bin_data_${binId}`,
      );
      if (rawCurrentBinId !== binId || !rawBinData) {
        throw new Error("MultiGame account seed is unavailable");
      }
      install(root, scope);
      const currentBinId = root.localStorage.getItem("current_bin_id");
      const binData = root.localStorage.getItem(`bin_data_${binId}`);
      if (currentBinId !== binId || !binData) {
        throw new Error("MultiGame account seed is unavailable");
      }
      root.__MULTI_GAME_BRIDGE_READY__ = { scope, binId };
    } catch {
      const code = "bridge-install-failed";
      root.__MULTI_GAME_BRIDGE_ERROR__ = { code };
      const renderFatal = () => {
        root.document.body.textContent = "游戏账号隔离初始化失败";
      };
      if (root.document.body) renderFatal();
      else root.document.addEventListener("DOMContentLoaded", renderFatal, {
        once: true,
      });

      if (root.parent && root.parent !== root) {
        root.parent.postMessage(
          { channel: "multi-game", version: 1, type: "fatal", scope, code },
          root.location.origin,
        );
      }
    }
  }
})(globalThis);
