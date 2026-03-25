
// create by elishell <75950346@qq.com>
import type { App } from "vue";

const _timeout = 5 * 1000;

const [key, val, timeout, ok, reject, reslove, config] = [
  Symbol("key"),
  Symbol("val"),
  Symbol("timeout"),
  Symbol("ok"),
  Symbol("reject"),
  Symbol("reslove"),
  Symbol("config"),
];

class Content {
  constructor() {}
}

class CacheItem {
  constructor(_key, _val, _t = _timeout) {
    this[key] = _key;
    this[val] = _val;
    this[timeout] = +new Date() + _t;

    this[reject] = [];
    this[reslove] = [];
  }

  get reject() {
    return this[reject];
  }

  get reslove() {
    return this[reslove];
  }

  get timeout() {
    return this[timeout];
  }

  get key() {
    return this[key];
  }

  set val(data) {
    this[ok] = true;
    this[val] = data;
  }

  get val() {
    return this[val];
  }

  toJSON() {
    return {
      key: this[key],
      val: this[val],
      timeout: this[timeout],
    };
  }

  isTimeout() {
    return this[timeout] < +new Date();
  }

  isOk() {
    return this[ok];
  }
}

class Cache {
  constructor(name, { content = new Content(), timeout = _timeout }) {
    this.name = name;
    this.content = content;
    this[config] = {
      content,
      timeout,
    };
  }

  async get(key, callback, conf) {
    const item = this.content[key];
    // 没有 初始化
    if (item != null) {
      if (!item.isOk()) {
        return new Promise((reslove, reject) => {
          item.reslove.push(reslove);
          item.reject.push(reject);
        });
      }
      if (!item.isTimeout()) {
        return item.val;
      }
    }
    return this.feach(key, callback, {
      ...this[config],
      ...conf,
    });
  }

  async feach(key, callback, conf = this[config]) {
    const oldItem = this.content[key];
    const newItem = new CacheItem(key, null, conf.timeout);
    this.content[key] = newItem;
    let data;
    if (callback instanceof Function || callback instanceof Promise) {
      try {
        data = await callback(key, conf);
        oldItem && oldItem.reslove.map((f) => f && f(data));
        newItem && newItem.reslove.map((f) => f && f(data));
      } catch (e) {
        console.error(`${this.name}-${key}: the ajax request is failed : ${e}`);
        oldItem && oldItem.reject.map((f) => f && f(data));
        newItem && newItem.reject.map((f) => f && f(data));
      }
    } else {
      data = callback;
      oldItem && oldItem.reslove.map((f) => f && f(data));
      newItem && newItem.reslove.map((f) => f && f(data));
    }
    oldItem && ((oldItem.reject.length = 0), (oldItem.reslove.length = 0));
    newItem && ((newItem.reject.length = 0), (newItem.reslove.length = 0));
    return (newItem.val = data);
  }

  clean(content = new Content()) {
    this.content = content;
  }
}

class CacheManager {
  constructor(content = new Content(), timeout = _timeout) {
    this.content = content;
    this.timeout = timeout;
  }

  getCache(name, config) {
    let cache = this.content[name];
    if (cache == null) {
      this.content[name] = cache = new Cache(name, {
        timeout: this.timeout,
        ...config,
      });
    } else {
      config && (cache.timeout = config.timeout);
    }
    return cache;
  }

  delCache(name) {
    delete this.content[name];
  }

  clear() {
    this.content = new Content();
  }
}

const $CacheManager = new CacheManager();

const install = (vm:App, options:any) => {
  if (vm.version.startWith("3.")) {
    vm.config.globalProperties.$CacheManager = $CacheManager;
  } else {
    vm.prototype.$CacheManager = $CacheManager;
  }
};

window.$CacheManager = $CacheManager;

export { $CacheManager, Content, CacheManager, Cache, install };
