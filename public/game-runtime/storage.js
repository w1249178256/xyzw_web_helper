(function (root) {
  'use strict';
  const BASE = 'login_multi:v1:';
  const DEFAULTS = Object.freeze({ width: 360, height: 640, fps: 30 });
  const LIMITS = Object.freeze({ width: [240, 1920], height: [320, 2160], fps: [10, 60] });
  function validId(id) { return typeof id === 'string' && /^m_[a-z0-9_-]{6,64}$/.test(id); }
  function prefix(id) {
    if (!validId(id)) throw new Error('无效的窗口编号');
    return BASE + 'instance:' + id + ':';
  }
  function readJSON(storage, key, fallback) {
    try { const value = JSON.parse(storage.getItem(key)); return value == null ? fallback : value; }
    catch (_) { return fallback; }
  }
  function settings(value) {
    const result = {};
    for (const key of Object.keys(DEFAULTS)) {
      const n = Number(value && value[key]);
      result[key] = Number.isInteger(n) && n >= LIMITS[key][0] && n <= LIMITS[key][1] ? n : DEFAULTS[key];
    }
    return result;
  }
  function accountKey(item) {
    const server = Number(item?.serverId), role = String(item?.roleId ?? '');
    return Number.isSafeInteger(server) && server > 0 && /^\d+$/.test(role) && BigInt(role) > 0n
      ? 'role:' + server + ':' + BigInt(role).toString() : 'bin:' + item?.id;
  }
  function normalizeAccount(item) {
    if (!item || typeof item.id !== 'string' || !/^[\w-]{1,100}$/.test(item.id) ||
        typeof item.hex !== 'string' || !item.hex.length || item.hex.length > 4 * 1024 * 1024 ||
        item.hex.length % 2 || !/^[\da-f]+$/i.test(item.hex)) return null;
    const result = { ...item, key: accountKey(item) };
    return result;
  }
  function accountName(item) {
    return String(item.displayName || (item.nameCustomized && item.name) || item.roleName || item.name || '已保存账号');
  }
  function mergeAccountLists(existing, incoming) {
    const next = existing.slice(), aliases = new Map(), results = [];
    for (const account of incoming.map(normalizeAccount).filter(Boolean)) {
      const previous = next.find(item => item.key === account.key || item.id === account.id);
      let insertion = next.length;
      for (let i = next.length - 1; i >= 0; i--) {
        if (next[i].key === account.key || next[i].id === account.id) {
          if (next[i].displayName) account.displayName = next[i].displayName;
          aliases.set(next[i].key, account.key);
          insertion = i; next.splice(i, 1);
        }
      }
      next.splice(insertion, 0, account);
      results.push({ exists: !!previous, updated: !!previous && previous.hex.toLowerCase() !== account.hex.toLowerCase(), item: account });
    }
    return { accounts: next, aliases, results };
  }
  class AccountCatalog {
    constructor(storage) {
      this.storage = storage;
      this.hasSavedList = storage.getItem(BASE + 'accounts') !== null;
      const saved = readJSON(storage, BASE + 'accounts', []);
      this.list = Array.isArray(saved) ? saved.map(normalizeAccount).filter(Boolean) : [];
      const deleted = readJSON(storage, BASE + 'deleted-accounts', []);
      this.deleted = new Set(Array.isArray(deleted) ? deleted.filter(x => typeof x === 'string') : []);
    }
    commit(list, deleted = this.deleted) {
      const key = BASE + 'deleted-accounts', previous = this.storage.getItem(key);
      this.storage.setItem(key, JSON.stringify([...deleted]));
      try { this.storage.setItem(BASE + 'accounts', JSON.stringify(list)); }
      catch (error) {
        try { previous === null ? this.storage.removeItem(key) : this.storage.setItem(key, previous); } catch (_) {}
        throw error;
      }
      this.list = list; this.deleted = deleted; this.hasSavedList = true;
    }
    merge(incoming, explicit = false) {
      const accepted = incoming.map(normalizeAccount).filter(Boolean).filter(a =>
        explicit || (!this.deleted.has(a.key) && !this.deleted.has('id:' + a.id)));
      const merged = mergeAccountLists(this.list, accepted);
      const deleted = new Set(this.deleted);
      if (explicit) for (const a of accepted) { deleted.delete(a.key); deleted.delete('id:' + a.id); }
      this.commit(merged.accounts, deleted);
      return merged;
    }
    rename(key, name) {
      name = String(name).trim().slice(0, 40);
      if (!name) throw new Error('请输入账号名称');
      this.commit(this.list.map(a => a.key === key ? { ...a, displayName: name } : a));
    }
    remove(keys) {
      const selected = new Set(keys), removed = this.list.filter(a => selected.has(a.key));
      const deleted = new Set(this.deleted);
      for (const a of removed) { deleted.add(a.key); deleted.add('id:' + a.id); }
      this.commit(this.list.filter(a => !selected.has(a.key)), deleted);
      return removed;
    }
  }
  function readAccounts(storage, scope = '') {
    const list = readJSON(storage, scope + 'bin_file_list', []);
    if (!Array.isArray(list)) return [];
    return list.flatMap(item => {
      if (!item || typeof item.id !== 'string') return [];
      const hex = storage.getItem(scope + 'bin_data_' + item.id);
      if (!hex || hex.length > 4 * 1024 * 1024 || hex.length % 2 || !/^[\da-f]+$/i.test(hex)) return [];
      return [{ ...item, hex, key: accountKey(item) }];
    });
  }
  // A Storage-compatible facade: clear(), property access and enumeration are scoped too.
  // Methods remain writable because the existing game patches setItem/removeItem.
  function scopeStorage(native, scope, onChange = function () {}) {
    const target = Object.create(null);
    function keys() {
      const result = [];
      for (let i = 0; i < native.length; i++) {
        const key = native.key(i);
        if (key && key.startsWith(scope)) result.push(key.slice(scope.length));
      }
      return result;
    }
    const methods = {
      getItem(key) { return native.getItem(scope + String(key)); },
      setItem(key, value) { key = String(key); native.setItem(scope + key, String(value)); onChange(key); },
      removeItem(key) { key = String(key); native.removeItem(scope + key); onChange(key); },
      clear() { keys().forEach(key => native.removeItem(scope + key)); onChange(null); },
      key(index) { return keys()[Number(index) >>> 0] ?? null; }
    };
    for (const [name, value] of Object.entries(methods)) {
      Object.defineProperty(target, name, { value, writable: true, configurable: true });
    }
    Object.defineProperty(target, 'length', { get: () => keys().length, configurable: true });
    Object.defineProperty(target, Symbol.toStringTag, { value: 'Storage', configurable: true });
    return new Proxy(target, {
      get(obj, key) { return key in obj || typeof key === 'symbol' ? Reflect.get(obj, key) : methods.getItem(key) ?? undefined; },
      set(obj, key, value) {
        if (key in obj || typeof key === 'symbol') return Reflect.set(obj, key, value);
        methods.setItem(key, value); return true;
      },
      deleteProperty(obj, key) { if (key in obj) return Reflect.deleteProperty(obj, key); methods.removeItem(key); return true; },
      ownKeys(obj) { return [...new Set([...Reflect.ownKeys(obj), ...keys()])]; },
      has(obj, key) { return key in obj || (typeof key === 'string' && methods.getItem(key) !== null); },
      getOwnPropertyDescriptor(obj, key) {
        return Reflect.getOwnPropertyDescriptor(obj, key) || (typeof key === 'string' && methods.getItem(key) !== null
          ? { value: methods.getItem(key), writable: true, enumerable: true, configurable: true } : undefined);
      },
      defineProperty(obj, key, descriptor) {
        if (key in obj || typeof key === 'symbol') return Reflect.defineProperty(obj, key, descriptor);
        if ('value' in descriptor) { methods.setItem(key, descriptor.value); return true; }
        return false;
      }
    });
  }
  const api = { BASE, DEFAULTS, LIMITS, validId, prefix, settings, readJSON, scopeStorage, readAccounts, accountKey, normalizeAccount, accountName, mergeAccountLists, AccountCatalog,
    STATE_KEY: BASE + 'dashboard', ACCOUNTS_KEY: BASE + 'accounts', CHANNEL: 'login-multi-v1' };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MultiCore = Object.freeze(api);
})(typeof window === 'object' ? window : globalThis);
