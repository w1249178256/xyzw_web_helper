/**
 * BON (Binary Object Notation) 协议实现
 * 基于提供的真实 BON 源码重新实现
 */
import lz4 from "lz4js";

// -----------------------------
// BON 编解码器核心实现
// -----------------------------

export class Int64 {
  constructor(high, low) {
    this.high = high;
    this.low = low;
  }
}

export class DataReader {
  constructor(bytes) {
    this._data = bytes || new Uint8Array(0);
    this._view = null;
    this.position = 0;
  }

  get data() {
    return this._data;
  }
  get dataView() {
    return (
      this._view ||
      (this._view = new DataView(
        this._data.buffer,
        this._data.byteOffset,
        this._data.byteLength,
      ))
    );
  }

  reset(bytes) {
    this._data = bytes;
    this.position = 0;
    this._view = null;
  }

  validate(n) {
    if (this.position + n > this._data.length) {
      console.error("read eof");
      return false;
    }
    return true;
  }

  readUInt8() {
    if (!this.validate(1)) return;
    return this._data[this.position++];
  }

  readInt16() {
    if (!this.validate(2)) return;
    const v = this._data[this.position++] | (this._data[this.position++] << 8);
    return (v << 16) >> 16;
  }

  readInt32() {
    if (!this.validate(4)) return;
    const v =
      this._data[this.position++] |
      (this._data[this.position++] << 8) |
      (this._data[this.position++] << 16) |
      (this._data[this.position++] << 24);
    return v | 0;
  }

  readInt64() {
    const lo = this.readInt32();
    if (lo === undefined) return;
    let _lo = lo;
    if (_lo < 0) _lo += 0x100000000;
    const hi = this.readInt32();
    if (hi === undefined) return;
    return _lo + 0x100000000 * hi;
  }

  readFloat32() {
    if (!this.validate(4)) return;
    const v = this.dataView.getFloat32(this.position, true);
    this.position += 4;
    return v;
  }

  readFloat64() {
    if (!this.validate(8)) return;
    const v = this.dataView.getFloat64(this.position, true);
    this.position += 8;
    return v;
  }

  read7BitInt() {
    let value = 0;
    let shift = 0;
    let b = 0;
    let count = 0;
    do {
      if (count++ === 35) throw new Error("Format_Bad7BitInt32");
      b = this.readUInt8();
      value |= (b & 0x7f) << shift;
      shift += 7;
    } while ((b & 0x80) !== 0);
    return value >>> 0;
  }

  readUTF() {
    const len = this.read7BitInt();
    return this.readUTFBytes(len);
  }

  readUint8Array(length, copy = false) {
    const start = this.position;
    const end = start + length;
    const out = copy
      ? this._data.slice(start, end)
      : this._data.subarray(start, end);
    this.position = end;
    return out;
  }

  readUTFBytes(length) {
    if (length === 0) return "";
    if (!this.validate(length)) return;
    const str = new TextDecoder("utf8").decode(
      this._data.subarray(this.position, this.position + length),
    );
    this.position += length;
    return str;
  }
}

let _shared = new Uint8Array(524288); // 512 KB initial buffer

export class DataWriter {
  constructor() {
    this.position = 0;
    this._view = null;
    this.data = _shared;
  }

  get dataView() {
    return (
      this._view ||
      (this._view = new DataView(this.data.buffer, 0, this.data.byteLength))
    );
  }

  reset() {
    this.data = _shared;
    this._view = null;
    this.position = 0;
  }

  ensureBuffer(size) {
    if (this.position + size <= _shared.byteLength) return;
    const prev = _shared;
    const need = this.position + size;
    const nextLen = Math.max(Math.floor((_shared.byteLength * 12) / 10), need);
    _shared = new Uint8Array(nextLen);
    _shared.set(prev, 0);
    this.data = _shared;
    this._view = null;
  }

  writeInt8(v) {
    this.ensureBuffer(1);
    this.data[this.position++] = v | 0;
  }

  writeInt16(v) {
    this.ensureBuffer(2);
    this.data[this.position++] = v | 0;
    this.data[this.position++] = (v >> 8) & 0xff;
  }

  writeInt32(v) {
    this.ensureBuffer(4);
    this.data[this.position++] = v | 0;
    this.data[this.position++] = (v >> 8) & 0xff;
    this.data[this.position++] = (v >> 16) & 0xff;
    this.data[this.position++] = (v >> 24) & 0xff;
  }

  writeInt64(v) {
    this.writeInt32(v);
    if (v < 0) {
      this.writeInt32(~Math.floor(-v / 0x100000000));
    } else {
      this.writeInt32(Math.floor(v / 0x100000000) | 0);
    }
  }

  writeFloat32(v) {
    this.ensureBuffer(4);
    this.dataView.setFloat32(this.position, v, true);
    this.position += 4;
  }

  writeFloat64(v) {
    this.ensureBuffer(8);
    this.dataView.setFloat64(this.position, v, true);
    this.position += 8;
  }

  _write7BitInt(v) {
    let n = v >>> 0;
    while (n >= 0x80) {
      this.data[this.position++] = (n & 0xff) | 0x80;
      n >>>= 7;
    }
    this.data[this.position++] = n & 0x7f;
  }

  write7BitInt(v) {
    this.ensureBuffer(5);
    this._write7BitInt(v);
  }

  _7BitIntLen(v) {
    return v < 0
      ? 5
      : v < 0x80
        ? 1
        : v < 0x4000
          ? 2
          : v < 0x200000
            ? 3
            : v < 0x10000000
              ? 4
              : 5;
  }

  writeUTF(str) {
    const t = str.length;
    if (t === 0) {
      this.write7BitInt(0);
      return;
    }
    const max = 6 * t;
    this.ensureBuffer(5 + max);
    const start = this.position;
    this.position += this._7BitIntLen(max);
    const from = this.position;
    const reserved = from - start;

    const encoder = new TextEncoder();
    const { written } = encoder.encodeInto(
      str,
      this.data.subarray(this.position),
    );
    this.position += written;
    const after = this.position;
    const size = after - from;

    this.position = start;
    this._write7BitInt(size);
    const used = this.position - start;
    if (used !== reserved) {
      this.data.copyWithin(from + (used - reserved), from, after);
    }
    this.position = from + size + (used - reserved);
  }

  writeUint8Array(src, offset = 0, length) {
    const start = offset | 0;
    const end = Math.min(src.byteLength, start + (length ?? src.byteLength));
    const n = end - start;
    if (n <= 0) return;
    this.ensureBuffer(n);
    this.data.set(src.subarray(start, end), this.position);
    this.position += n;
  }

  writeUTFBytes(str) {
    this.ensureBuffer(6 * str.length);
    const encoder = new TextEncoder();
    const { written } = encoder.encodeInto(
      str,
      this.data.subarray(this.position),
    );
    this.position += written;
  }

  getBytes(clone = false) {
    return clone
      ? this.data.slice(0, this.position)
      : this.data.subarray(0, this.position);
  }
}

export class BonEncoder {
  constructor() {
    this.dw = new DataWriter();
    this.strMap = new Map();
  }

  reset() {
    this.dw.reset();
    this.strMap.clear();
  }

  encodeInt(v) {
    this.dw.writeInt8(1);
    this.dw.writeInt32(v | 0);
  }

  encodeLong(v) {
    this.dw.writeInt8(2);
    if (typeof v === "number") {
      this.dw.writeInt64(v);
    } else {
      this.dw.writeInt32(v.low | 0);
      this.dw.writeInt32(v.high | 0);
    }
  }

  encodeFloat(v) {
    this.dw.writeInt8(3);
    this.dw.writeFloat32(v);
  }

  encodeDouble(v) {
    this.dw.writeInt8(4);
    this.dw.writeFloat64(v);
  }

  encodeNumber(v) {
    if ((v | 0) === v) this.encodeInt(v);
    else if (Math.floor(v) === v) this.encodeLong(v);
    else this.encodeDouble(v);
  }

  encodeString(s) {
    const hit = this.strMap.get(s);
    if (hit !== undefined) {
      this.dw.writeInt8(99); // StringRef
      this.dw.write7BitInt(hit);
      return;
    }
    this.dw.writeInt8(5); // String
    this.dw.writeUTF(s);
    this.strMap.set(s, this.strMap.size);
  }

  encodeBoolean(b) {
    this.dw.writeInt8(6);
    this.dw.writeInt8(b ? 1 : 0);
  }

  encodeNull() {
    this.dw.writeInt8(0);
  }

  encodeDateTime(d) {
    this.dw.writeInt8(10);
    this.dw.writeInt64(d.getTime());
  }

  encodeBinary(u8) {
    this.dw.writeInt8(7);
    this.dw.write7BitInt(u8.byteLength);
    this.dw.writeUint8Array(u8);
  }

  encodeArray(arr) {
    this.dw.writeInt8(9);
    this.dw.write7BitInt(arr.length);
    for (let i = 0; i < arr.length; i++) this.encode(arr[i]);
  }

  encodeMap(mp) {
    this.dw.writeInt8(8);
    this.dw.write7BitInt(mp.size);
    mp.forEach((v, k) => {
      this.encode(k);
      this.encode(v);
    });
  }

  encodeObject(obj) {
    this.dw.writeInt8(8);
    const keys = [];
    for (const k in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
      if (k.startsWith("_")) continue;
      const type = typeof obj[k];
      if (type === "function" || type === "undefined") continue;
      keys.push(k);
    }
    this.dw.write7BitInt(keys.length);
    for (const k of keys) {
      this.encode(k);
      this.encode(obj[k]);
    }
  }

  encode(v) {
    if (v == null) {
      this.encodeNull();
      return;
    }
    switch (v.constructor) {
      case Number:
        this.encodeNumber(v);
        return;
      case Boolean:
        this.encodeBoolean(v);
        return;
      case String:
        this.encodeString(v);
        return;
      case Int64:
        this.encodeLong(v);
        return;
      case Array:
        this.encodeArray(v);
        return;
      case Map:
        this.encodeMap(v);
        return;
      case Date:
        this.encodeDateTime(v);
        return;
      case Uint8Array:
        this.encodeBinary(v);
        return;
      default:
        if (typeof v !== "object") {
          this.encodeNull();
          return;
        }
        this.encodeObject(v);
        return;
    }
  }

  getBytes(clone = false) {
    return this.dw.getBytes(clone);
  }
}

export class BonDecoder {
  constructor() {
    this.dr = new DataReader(new Uint8Array(0));
    this.strArr = [];
  }

  reset(bytes) {
    this.dr.reset(bytes);
    this.strArr.length = 0;
  }

  decode() {
    const tag = this.dr.readUInt8();
    switch (tag) {
      default:
        return null;
      case 1:
        return this.dr.readInt32();
      case 2:
        return this.dr.readInt64();
      case 3:
        return this.dr.readFloat32();
      case 4:
        return this.dr.readFloat64();
      case 5: {
        const s = this.dr.readUTF();
        this.strArr.push(s);
        return s;
      }
      case 6:
        return this.dr.readUInt8() === 1;
      case 7: {
        const len = this.dr.read7BitInt();
        return this.dr.readUint8Array(len, false);
      }
      case 8: {
        const count = this.dr.read7BitInt();
        const obj = {};
        for (let i = 0; i < count; i++) {
          const k = this.decode();
          const v = this.decode();
          obj[k] = v;
        }
        return obj;
      }
      case 9: {
        const len = this.dr.read7BitInt();
        const arr = new Array(len);
        for (let i = 0; i < len; i++) arr[i] = this.decode();
        return arr;
      }
      case 10:
        return new Date(this.dr.readInt64());
      case 99:
        return this.strArr[this.dr.read7BitInt()];
    }
  }
}

// 单例实例
const _enc = new BonEncoder();
const _dec = new BonDecoder();

// BON 编解码函数
export const bon = {
  encode: (value, clone = true) => {
    _enc.reset();
    _enc.encode(value);
    return _enc.getBytes(clone);
  },
  decode: (bytes) => {
    _dec.reset(bytes);
    return _dec.decode();
  },
};

/** —— 协议消息包装，与原 ProtoMsg 类等价 盐场版本—— */
export class ProtoMsgLegion {
  constructor(raw) {
    if (raw?.cmd) {
      raw.cmd = raw.cmd.toLowerCase();
    }
    this._raw = raw;
    this._rawData = undefined;
    this._data = undefined;
    this._t = undefined;
    this._sendMsg = undefined;
    this.rtt = 0;
  }

  get sendMsg() {
    return this._sendMsg;
  }
  get seq() {
    return this._raw.seq;
  }
  get resp() {
    return this._raw.resp;
  }
  get ack() {
    return this._raw.ack;
  }
  get cmd() {
    return this._raw?.cmd && this._raw?.cmd.toLowerCase();
  }
  get code() {
    return ~~this._raw.code;
  }
  get error() {
    return this._raw.error;
  }
  get time() {
    return this._raw.time;
  }
  get body() {
    return this._raw.body;
  }
  get hint() {
    return this._raw.hint;
  }

  /** 惰性 decode body → rawData（bon.decode） */
  get rawData() {
    if (this._rawData !== undefined || this.body === undefined)
      return this._rawData;
    this._rawData = bon.decode(this.body);
    return this._rawData;
  }

  /** 指定数据类型 */
  setDataType(t) {
    if (t) this._t = { name: t.name ?? "Anonymous", ctor: t };
    return this;
  }

  /** 配置"请求"对象，让 respType 自动对齐 */
  setSendMsg(msg) {
    this._sendMsg = msg;
    return this.setDataType(msg.respType);
  }

  /** 将 rawData 反序列化为业务对象 */
  getData(clazz) {
    if (this._data !== undefined || this.rawData === undefined)
      return this._data;

    let t = this._t;
    if (clazz && t && clazz !== t.ctor) {
      console.warn(`getData type not match, ${clazz.name} != ${t.name}`);
      t = { name: clazz.name, ctor: clazz };
    }

    this._data = this.rawData;
    return this._data;
  }

  toLogString() {
    const e = { ...this._raw };
    delete e.body;
    e.data = this.rawData;
    e.rtt = this.rtt;
    return JSON.stringify(e);
  }
}

export class ProtoMsg {
  constructor(raw) {
    if (raw?.cmd) {
      raw.cmd = raw.cmd.toLowerCase();
    }
    this._raw = raw;
    this._rawData = undefined;
    this._data = undefined;
    this._t = undefined;
    this._sendMsg = undefined;
    this.rtt = 0;
  }

  get sendMsg() {
    return this._sendMsg;
  }
  get seq() {
    return this._raw.seq;
  }
  get resp() {
    return this._raw.resp;
  }
  get ack() {
    return this._raw.ack;
  }
  get cmd() {
    return this._raw?.cmd && this._raw?.cmd.toLowerCase();
  }
  get code() {
    return ~~this._raw.code;
  }
  get error() {
    return this._raw.error;
  }
  get time() {
    return this._raw.time;
  }
  get body() {
    return this._raw.body;
  }

  /** 惰性 decode body → rawData（bon.decode） */
  get rawData() {
    if (this._rawData !== undefined || this.body === undefined)
      return this._rawData;
    this._rawData = bon.decode(this.body);
    return this._rawData;
  }

  /** 指定数据类型 */
  setDataType(t) {
    if (t) this._t = { name: t.name ?? "Anonymous", ctor: t };
    return this;
  }

  /** 配置"请求"对象，让 respType 自动对齐 */
  setSendMsg(msg) {
    this._sendMsg = msg;
    return this.setDataType(msg.respType);
  }

  /** 将 rawData 反序列化为业务对象 */
  getData(clazz) {
    if (this._data !== undefined || this.rawData === undefined)
      return this._data;

    let t = this._t;
    if (clazz && t && clazz !== t.ctor) {
      console.warn(`getData type not match, ${clazz.name} != ${t.name}`);
      t = { name: clazz.name, ctor: clazz };
    }

    this._data = this.rawData;
    return this._data;
  }

  toLogString() {
    const e = { ...this._raw };
    delete e.body;
    e.data = this.rawData;
    e.rtt = this.rtt;
    return JSON.stringify(e);
  }
}

/** —— 加解密器注册表 —— */
const registry = new Map();

/** lz4 + 头部掩码的 "lx" 方案 */
const lx = {
  encrypt: (buf) => {
    let e = lz4.compress(buf);
    const t = 2 + ~~(Math.random() * 248);
    for (let n = Math.min(e.length, 100); --n >= 0; ) e[n] ^= t;

    // 写入标识与混淆位
    e[0] = 112;
    e[1] = 108;
    e[2] =
      (e[2] & 0b10101010) |
      (((t >> 7) & 1) << 6) |
      (((t >> 6) & 1) << 4) |
      (((t >> 5) & 1) << 2) |
      ((t >> 4) & 1);
    e[3] =
      (e[3] & 0b10101010) |
      (((t >> 3) & 1) << 6) |
      (((t >> 2) & 1) << 4) |
      (((t >> 1) & 1) << 2) |
      (t & 1);
    return e;
  },
  decrypt: (e) => {
    const t =
      (((e[2] >> 6) & 1) << 7) |
      (((e[2] >> 4) & 1) << 6) |
      (((e[2] >> 2) & 1) << 5) |
      ((e[2] & 1) << 4) |
      (((e[3] >> 6) & 1) << 3) |
      (((e[3] >> 4) & 1) << 2) |
      (((e[3] >> 2) & 1) << 1) |
      (e[3] & 1);
    for (let n = Math.min(100, e.length); --n >= 2; ) e[n] ^= t;
    e[0] = 4;
    e[1] = 34;
    e[2] = 77;
    e[3] = 24; // 还原头以便 lz4 解
    return lz4.decompress(e);
  },
};

/** 随机首 4 字节 + XOR 的 "x" 方案 */
const x = {
  encrypt: (e) => {
    const rnd = ~~(Math.random() * 0xffffffff) >>> 0;
    const n = new Uint8Array(e.length + 4);
    n[0] = rnd & 0xff;
    n[1] = (rnd >>> 8) & 0xff;
    n[2] = (rnd >>> 16) & 0xff;
    n[3] = (rnd >>> 24) & 0xff;
    n.set(e, 4);
    const r = 2 + ~~(Math.random() * 248);
    for (let i = n.length; --i >= 0; ) n[i] ^= r;
    n[0] = 112;
    n[1] = 120;
    n[2] =
      (n[2] & 0b10101010) |
      (((r >> 7) & 1) << 6) |
      (((r >> 6) & 1) << 4) |
      (((r >> 5) & 1) << 2) |
      ((r >> 4) & 1);
    n[3] =
      (n[3] & 0b10101010) |
      (((r >> 3) & 1) << 6) |
      (((r >> 2) & 1) << 4) |
      (((r >> 1) & 1) << 2) |
      (r & 1);
    return n;
  },
  decrypt: (e) => {
    const t =
      (((e[2] >> 6) & 1) << 7) |
      (((e[2] >> 4) & 1) << 6) |
      (((e[2] >> 2) & 1) << 5) |
      ((e[2] & 1) << 4) |
      (((e[3] >> 6) & 1) << 3) |
      (((e[3] >> 4) & 1) << 2) |
      (((e[3] >> 2) & 1) << 1) |
      (e[3] & 1);
    for (let n = e.length; --n >= 4; ) e[n] ^= t;
    return e.subarray(4);
  },
};

/** 依赖 globalThis.XXTEA 的 "xtm" 方案 */
const xtm = {
  encrypt: (e) =>
    globalThis.XXTEA
      ? globalThis.XXTEA.encryptMod({ data: e.buffer, length: e.length })
      : e,
  decrypt: (e) =>
    globalThis.XXTEA
      ? globalThis.XXTEA.decryptMod({ data: e.buffer, length: e.length })
      : e,
};

/** 注册器 */
function register(name, impl) {
  registry.set(name, impl);
}

register("lx", lx);
register("x", x);
register("xtm", xtm);

/** 默认使用 x 加密（自动检测解密） */
const passthrough = {
  encrypt: (e) => getEnc("x").encrypt(e),
  decrypt: (e) => {
    if (e.length > 4 && e[0] === 112 && e[1] === 108)
      e = getEnc("lx").decrypt(e);
    else if (e.length > 4 && e[0] === 112 && e[1] === 120)
      e = getEnc("x").decrypt(e);
    else if (e.length > 3 && e[0] === 112 && e[1] === 116)
      e = getEnc("xtm").decrypt(e);
    return e;
  },
};

/** 对外：按名称取加解密器；找不到则用默认 */
export function getEnc(name) {
  return registry.get(name) ?? passthrough;
}

/** 对外：encode（bon.encode → 加密） */
export function encode(obj, enc) {
  let bytes = bon.encode(obj, false);
  const out = enc.encrypt(bytes);
  return out.buffer.byteLength === out.length
    ? out.buffer
    : out.buffer.slice(0, out.length);
}

/** 对外：parse（解密 → bon.decode → ProtoMsg） */
export function parse(buf, enc, isLegion = false) {
  if (!isLegion) {
    const u8 = new Uint8Array(buf);
    const plain = enc.decrypt(u8);
    const raw = bon.decode(plain);
    return new ProtoMsg(raw);
  } else {
    return parseLegion(buf, enc, true);
  }
}

/** 对外：parse（解密 → bon.decode → ProtoMsg） 返回的消息体是盐场版本的消息体*/
function parseLegion(buf, enc, isLegion) {
  const u8 = new Uint8Array(buf);
  const plain = enc.decrypt(u8);
  const raw = bon.decode(plain);
  return new ProtoMsgLegion(raw);
}

// 游戏消息模板
export const GameMessages = {
  // 心跳消息
  heartBeat: (ack = 0, seq = 0) => ({
    ack,
    body: undefined,
    c: undefined,
    cmd: "_sys/ack",
    hint: undefined,
    seq,
    time: Date.now(),
  }),

  // 获取角色信息
  getRoleInfo: (ack = 0, seq = 0, params = {}) => ({
    cmd: "role_getroleinfo",
    body: encode(
      {
        clientVersion: "2.20.1-e249aa927a8ffe4c-wx",
        inviteUid: 0,
        platform: "hortor",
        platformExt: "mix",
        scene: "",
        ...params,
      },
      getEnc("x"),
    ),
    ack: ack || 0,
    seq: seq || 0,
    time: Date.now(),
  }),

  // 获取数据包版本
  getDataBundleVer: (ack = 0, seq = 0, params = {}) => ({
    cmd: "system_getdatabundlever",
    body: encode(
      {
        isAudit: false,
        ...params,
      },
      getEnc("x"),
    ),
    ack: ack || 0,
    seq: seq || 0,
    time: Date.now(),
  }),

  // 购买金币
  buyGold: (ack = 0, seq = 0, params = {}) => ({
    ack,
    body: encode(
      {
        buyNum: 1,
        ...params,
      },
      getEnc("x"),
    ),
    cmd: "system_buygold",
    seq,
    time: Date.now(),
  }),

  // 签到奖励
  signInReward: (ack = 0, seq = 0, params = {}) => ({
    ack,
    body: encode(
      {
        ...params,
      },
      getEnc("x"),
    ),
    cmd: "system_signinreward",
    seq,
    time: Date.now(),
  }),

  // 领取每日任务奖励
  claimDailyReward: (ack = 0, seq = 0, params = {}) => ({
    ack,
    body: encode(
      {
        rewardId: 0,
        ...params,
      },
      getEnc("x"),
    ),
    cmd: "task_claimdailyreward",
    seq,
    time: Date.now(),
  }),
};

// 创建全局实例
export const g_utils = {
  getEnc,
  encode: (obj, encName = "x") => encode(obj, getEnc(encName)),
  parse: (data, encName = "auto") => parse(data, getEnc(encName)),
  bon, // 添加BON编解码器
};

// 兼容性导出（保持旧的接口）
export const bonProtocol = {
  encode: bon.encode,
  decode: bon.decode,
  createMessage: (cmd, body = {}, ack = 0, seq = 0, options = {}) => ({
    cmd,
    body: bon.encode(body),
    ack: ack || 0,
    seq: seq || 0,
    time: Date.now(),
    ...options,
  }),
  parseMessage: (messageData) => {
    try {
      let message;
      if (typeof messageData === "string") {
        message = JSON.parse(messageData);
      } else {
        message = messageData;
      }
      if (
        message.body &&
        (message.body instanceof ArrayBuffer ||
          message.body instanceof Uint8Array)
      ) {
        message.body = bon.decode(message.body);
      }
      return message;
    } catch (error) {
      console.error("消息解析失败:", error);
      return {
        error: true,
        message: "消息解析失败",
        originalData: messageData,
      };
    }
  },
  generateSeq: () => Math.floor(Math.random() * 1000000),
  generateMessageId: () =>
    "msg_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
};

// 导出单独的加密器类以兼容测试文件
export const LXCrypto = lx;
export const XCrypto = x;
export const XTMCrypto = xtm;

export default {
  ProtoMsg,
  getEnc,
  encode,
  parse,
  GameMessages,
  g_utils,
  bon,
  bonProtocol,
};
