// import { readFileSync, writeFileSync } from 'fs'
import { bon } from '../src/main/crypto/bon.js'
import { crypto } from '../src/main/crypto/crypto.js'

for (const fileName of ['01-23.61万-1815服-494510500-双蛋瓦斯.bin']) {
  const data = readFileSync('./test/' + fileName)
  const msg = bon.decryptAndDecodeRequestBody(data)
  msg.info_obj = JSON.parse(msg.info)
  writeFileSync('./test/' + fileName + '.json', JSON.stringify(msg, undefined, '  '), 'utf-8')
}
