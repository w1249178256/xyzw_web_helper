/**
 * BIN文件解析脚本
 * 用于解析游戏BIN文件，提取角色信息并生成Token
 * 
 * 使用方法:
 *   node parse_bin.js <bin文件路径>
 * 
 * 输出:
 *   - 角色列表（包含角色名、ID、服务器等）
 *   - 每个角色的Token JSON文件
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const http = require('http');

// ==================== BON协议实现 ====================

class DataReader {
  constructor(bytes) {
    this._data = bytes;
    this._view = null;
    this.position = 0;
  }

  get dataView() {
    return this._view || (this._view = new DataView(this._data.buffer, this._data.byteOffset, this._data.byteLength));
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
    const v = this._data[this.position++] |
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

  readUTFBytes(length) {
    if (length === 0) return '';
    if (!this.validate(length)) return;
    const str = new TextDecoder('utf8').decode(
      this._data.subarray(this.position, this.position + length)
    );
    this.position += length;
    return str;
  }
}

// LZ4解压实现（简化版）
const lz4 = require('lz4');

// 加密器实现
const lx = {
  encrypt: (buf) => {
    let e = lz4.encode(buf);
    const t = 2 + Math.floor(Math.random() * 248);
    for (let n = Math.min(e.length, 100); --n >= 0;) e[n] ^= t;
    e[0] = 112;
    e[1] = 108;
    e[2] = (e[2] & 0b10101010) | (((t >> 7) & 1) << 6) | (((t >> 6) & 1) << 4) | (((t >> 5) & 1) << 2) | ((t >> 4) & 1);
    e[3] = (e[3] & 0b10101010) | (((t >> 3) & 1) << 6) | (((t >> 2) & 1) << 4) | (((t >> 1) & 1) << 2) | (t & 1);
    return e;
  },
  decrypt: (e) => {
    const t = (((e[2] >> 6) & 1) << 7) | (((e[2] >> 4) & 1) << 6) | (((e[2] >> 2) & 1) << 5) | ((e[2] & 1) << 4) |
      (((e[3] >> 6) & 1) << 3) | (((e[3] >> 4) & 1) << 2) | (((e[3] >> 2) & 1) << 1) | (e[3] & 1);
    for (let n = Math.min(100, e.length); --n >= 2;) e[n] ^= t;
    e[0] = 4;
    e[1] = 108;
    e[2] = 77;
    e[3] = 24;
    return lz4.decode(e);
  },
};

const x = {
  encrypt: (e) => {
    const rnd = Math.floor(Math.random() * 0xffffffff) >>> 0;
    const n = Buffer.alloc(e.length + 4);
    n[0] = rnd & 0xff;
    n[1] = (rnd >>> 8) & 0xff;
    n[2] = (rnd >>> 16) & 0xff;
    n[3] = (rnd >>> 24) & 0xff;
    for (let i = 0; i < e.length; i++) {
      n[i + 4] = e[i] ^ (rnd & 0xff);
      rnd = ((rnd >>> 8) | (rnd << 24)) >>> 0;
    }
    n[0] = 112;
    n[1] = 120;
    return n;
  },
  decrypt: (e) => {
    const rnd = (e[0] & 0xff) | ((e[1] & 0xff) << 8) | ((e[2] & 0xff) << 16) | ((e[3] & 0xff) << 24);
    const out = Buffer.alloc(e.length - 4);
    let r = rnd;
    for (let i = 0; i < e.length - 4; i++) {
      out[i] = e[i + 4] ^ (r & 0xff);
      r = ((r >>> 8) | (r << 24)) >>> 0;
    }
    return out;
  },
};

const passthrough = {
  encrypt: (e) => x.encrypt(e),
  decrypt: (e) => {
    if (e.length > 4 && e[0] === 112 && e[1] === 108) e = lx.decrypt(e);
    else if (e.length > 4 && e[0] === 112 && e[1] === 120) e = x.decrypt(e);
    return e;
  },
};

// BON解码器
const bon = {
  decode: (bytes) => {
    const reader = new DataReader(bytes);
    return decodeValue(reader);
  },
  encode: (obj) => {
    // 简化版，仅实现基本编码
    const parts = [];
    encodeValue(obj, parts);
    return Buffer.concat(parts);
  }
};

function decodeValue(reader) {
  const type = reader.readUInt8();
  switch (type) {
    case 0: return null;
    case 1: return reader.readUInt8() !== 0;
    case 2: return reader.readInt32();
    case 3: return reader.readInt64();
    case 4: return reader.readFloat32();
    case 5: return reader.readFloat64();
    case 6: return reader.readUTF();
    case 7: {
      const len = reader.read7BitInt();
      const arr = [];
      for (let i = 0; i < len; i++) arr.push(decodeValue(reader));
      return arr;
    }
    case 8: {
      const len = reader.read7BitInt();
      const obj = {};
      for (let i = 0; i < len; i++) {
        const key = decodeValue(reader);
        obj[key] = decodeValue(reader);
      }
      return obj;
    }
    default: throw new Error(`Unknown type: ${type}`);
  }
}

function encodeValue(obj, parts) {
  if (obj === null || obj === undefined) {
    parts.push(Buffer.from([0]));
  } else if (typeof obj === 'boolean') {
    parts.push(Buffer.from([1, obj ? 1 : 0]));
  } else if (typeof obj === 'number') {
    if (Number.isInteger(obj)) {
      parts.push(Buffer.from([2]));
      const buf = Buffer.alloc(4);
      buf.writeInt32LE(obj);
      parts.push(buf);
    } else {
      parts.push(Buffer.from([5]));
      const buf = Buffer.alloc(8);
      buf.writeDoubleLE(obj);
      parts.push(buf);
    }
  } else if (typeof obj === 'string') {
    parts.push(Buffer.from([6]));
    const strBuf = Buffer.from(obj, 'utf8');
    parts.push(encode7BitInt(strBuf.length));
    parts.push(strBuf);
  } else if (Array.isArray(obj)) {
    parts.push(Buffer.from([7]));
    parts.push(encode7BitInt(obj.length));
    for (const item of obj) encodeValue(item, parts);
  } else if (typeof obj === 'object') {
    parts.push(Buffer.from([8]));
    const keys = Object.keys(obj);
    parts.push(encode7BitInt(keys.length));
    for (const key of keys) {
      encodeValue(key, parts);
      encodeValue(obj[key], parts);
    }
  }
}

function encode7BitInt(value) {
  const bytes = [];
  do {
    let byte = value & 0x7f;
    value >>>= 7;
    if (value !== 0) byte |= 0x80;
    bytes.push(byte);
  } while (value !== 0);
  return Buffer.from(bytes);
}

// ProtoMsg类
class ProtoMsg {
  constructor(raw) {
    this._raw = raw;
  }

  getData() {
    return this._raw;
  }
}

// 解析函数
function parse(buf) {
  const u8 = new Uint8Array(buf);
  const plain = passthrough.decrypt(Buffer.from(u8));
  const raw = bon.decode(plain);
  return new ProtoMsg(raw);
}

// 编码函数
function encode(obj) {
  const bytes = bon.encode(obj);
  return x.encrypt(bytes);
}

// ==================== 工具函数 ====================

function getTokenId(buffer) {
  const hash = crypto.createHash('md5');
  hash.update(Buffer.from(buffer));
  return hash.digest('hex');
}

function httpPost(url, data, contentType = 'application/octet-stream') {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = client.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function transformToken(arrayBuffer) {
  const res = await httpPost(
    'https://xxz-xyzw.hortorgames.com/login/authuser?_seq=1',
    arrayBuffer
  );
  const msg = parse(res);
  const data = msg.getData();
  const currentTime = Date.now();
  const sessId = currentTime * 100 + Math.floor(Math.random() * 100);
  const connId = currentTime + Math.floor(Math.random() * 10);

  return JSON.stringify({
    ...data,
    sessId,
    connId,
    isRestore: 0,
  });
}

async function getServerList(arrayBuffer) {
  const res = await httpPost(
    'https://xxz-xyzw.hortorgames.com/login/serverlist?_seq=3',
    arrayBuffer
  );
  const msg = parse(res);
  const data = msg.getData();
  console.log('服务器数据:', data);
  return data.roles || {};
}

// ==================== 主函数 ====================

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('使用方法: node parse_bin.js <bin文件路径> [输出目录]');
    console.log('示例: node parse_bin.js role.bin ./output');
    process.exit(1);
  }

  const binFilePath = args[0];
  const outputDir = args[1] || './output';

  if (!fs.existsSync(binFilePath)) {
    console.error(`错误: 文件不存在 - ${binFilePath}`);
    process.exit(1);
  }

  // 创建输出目录
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`正在读取BIN文件: ${binFilePath}`);
  const binBuffer = fs.readFileSync(binFilePath);

  // 解析BIN文件
  console.log('正在解析BIN文件...');
  try {
    const msg = parse(binBuffer);
    const binData = msg.getData();
    console.log('BIN文件解析成功!');
    console.log('原始数据:', JSON.stringify(binData, null, 2));

    // 获取服务器角色列表
    console.log('\n正在获取服务器角色列表...');
    const roles = await getServerList(binBuffer);
    const roleArray = Object.values(roles).sort((a, b) => b.power - a.power);

    console.log(`\n找到 ${roleArray.length} 个角色:`);
    roleArray.forEach((role, index) => {
      console.log(`${index + 1}. ${role.name} (ID: ${role.roleId}, 战力: ${role.power})`);
    });

    // 为每个角色生成Token
    console.log('\n正在生成角色Token...');
    const tokens = [];

    for (const role of roleArray) {
      try {
        const newData = { ...binData, serverId: role.serverId };
        const newBinBuffer = encode(newData);
        const tokenId = getTokenId(newBinBuffer);
        const roleToken = await transformToken(newBinBuffer);

        let sid = Number(role.serverId);
        let roleIndex = 0;
        if (sid >= 2000000) {
          roleIndex = 2;
          sid -= 2000000;
        } else if (sid >= 1000000) {
          roleIndex = 1;
          sid -= 1000000;
        }
        const serverNum = sid - 27;

        const tokenInfo = {
          id: tokenId,
          name: `${role.name}-${roleIndex}-${role.roleId}`,
          roleId: role.roleId,
          token: roleToken,
          server: `${serverNum}服`,
          roleIndex: roleIndex,
          importMethod: 'bin',
        };

        tokens.push(tokenInfo);

        // 保存Token到文件
        const tokenFile = path.join(outputDir, `${tokenId}.json`);
        fs.writeFileSync(tokenFile, roleToken, 'utf8');
        console.log(`✓ 角色 ${role.name} Token已保存: ${tokenFile}`);

      } catch (error) {
        console.error(`✗ 角色 ${role.name} Token生成失败: ${error.message}`);
      }
    }

    // 保存所有Token信息
    const summaryFile = path.join(outputDir, 'tokens_summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify(tokens, null, 2), 'utf8');
    console.log(`\nToken摘要已保存: ${summaryFile}`);
    console.log(`\n成功生成 ${tokens.length}/${roleArray.length} 个Token`);

  } catch (error) {
    console.error('解析失败:', error);
    process.exit(1);
  }
}

// TextDecoder polyfill for Node.js
if (typeof TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder;
}

main().catch(console.error);
