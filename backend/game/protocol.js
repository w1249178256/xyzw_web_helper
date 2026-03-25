'use strict';

/**
 * BON (Binary Object Notation) protocol implementation - CommonJS port
 * Ported from src/utils/bonProtocol.js (ES module) to CJS for Node.js backend use.
 */

// Optional lz4js dependency
let lz4;
try {
  lz4 = require('lz4js');
} catch {
  lz4 = null;
}

// -----------------------------
// BON core classes
// -----------------------------

class Int64 {
  constructor(high, low) {
    this.high = high;
    this.low = low;
  }
}

class DataReader {
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
      console.error('read eof');
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
      if (count++ === 35) throw new Error('Format_Bad7BitInt32');
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
    if (length === 0) return '';
    if (!this.validate(length)) return;
    const str = new TextDecoder('utf8').decode(
      this._data.subarray(this.position, this.position + length),
    );
    this.position += length;
    return str;
  }
}

let _shared = new Uint8Array(524288); // 512 KB initial buffer

class DataWriter {
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

class BonEncoder {
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
    if (typeof v === 'number') {
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
      if (k.startsWith('_')) continue;
      const type = typeof obj[k];
      if (type === 'function' || type === 'undefined') continue;
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
        if (typeof v !== 'object') {
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

class BonDecoder {
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

// Singleton encoder/decoder instances
const _enc = new BonEncoder();
const _dec = new BonDecoder();

const bon = {
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

// -----------------------------
// Encryption schemes
// -----------------------------

/** lz4 + header mask "lx" scheme */
const lx = {
  encrypt: (buf) => {
    if (!lz4) throw new Error('lz4js not available');
    let e = lz4.compress(buf);
    const t = 2 + ~~(Math.random() * 248);
    for (let n = Math.min(e.length, 100); --n >= 0; ) e[n] ^= t;
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
    if (!lz4) throw new Error('lz4js not available');
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
    e[3] = 24;
    return lz4.decompress(e);
  },
};

/** Random 4-byte prefix + XOR "x" scheme */
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

/** Encryption scheme registry */
const registry = new Map();

function register(name, impl) {
  registry.set(name, impl);
}

/** Passthrough / auto-detect scheme */
const passthrough = {
  encrypt: (e) => getEnc('x').encrypt(e),
  decrypt: (e) => {
    if (e.length > 4 && e[0] === 112 && e[1] === 108)
      e = getEnc('lx').decrypt(e);
    else if (e.length > 4 && e[0] === 112 && e[1] === 120)
      e = getEnc('x').decrypt(e);
    // xtm not supported in Node.js (requires globalThis.XXTEA browser lib)
    return e;
  },
};

register('lx', lx);
register('x', x);

/**
 * Get encryption scheme by name. Returns passthrough (auto-detect) if not found.
 */
function getEnc(name) {
  return registry.get(name) || passthrough;
}

/**
 * BON-encode an object, then encrypt it.
 * Returns an ArrayBuffer suitable for sending over WebSocket.
 */
function encode(obj, enc) {
  const bytes = bon.encode(obj, false);
  const out = enc.encrypt(bytes);
  return out.buffer.byteLength === out.length
    ? out.buffer
    : out.buffer.slice(0, out.length);
}

/**
 * Decrypt a buffer and BON-decode it, returning the raw plain object.
 * (Unlike the frontend version, does NOT wrap in ProtoMsg.)
 */
function parse(buf, enc) {
  const u8 = new Uint8Array(buf);
  const plain = enc.decrypt(u8);
  const raw = bon.decode(plain);
  return raw;
}

module.exports = { bon, getEnc, encode, parse, DataReader, DataWriter, BonEncoder, BonDecoder };
