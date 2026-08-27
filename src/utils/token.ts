import axios from "axios";
import { MD5, lib, enc } from "crypto-js";
import { g_utils } from "@/utils/bonProtocol";

export const getTokenId = (token: string | ArrayBuffer | Uint8Array) => {
  const binHash = MD5(lib.WordArray.create(token)).toString(enc.Hex);
  return binHash;
};

export const transformToken = async (arrayBuffer: ArrayBuffer) => {
  const res = await axios.post(
    "https://xxz-xyzw.hortorgames.com/login/authuser",
    arrayBuffer,
    {
      params: {
        _seq: 1,
      },
      headers: {
        "Content-Type": "application/octet-stream",
        referrerPolicy: "no-referrer",
      },
      responseType: "arraybuffer",
    },
  );
  const msg = g_utils.parse(res.data);
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
};

export const getServerList = async (arrayBuffer: ArrayBuffer) => {
  // 如果是data URL格式，提取base64部分
  const res = await axios.post(
    "https://xxz-xyzw.hortorgames.com/login/serverlist",
    arrayBuffer,
    {
      params: {
        _seq: 3,
      },
      headers: {
        "Content-Type": "application/octet-stream",
        referrerPolicy: "no-referrer",
      },
      responseType: "arraybuffer",
    },
  );
  // console.log("res:", res);

  const msg = g_utils.parse(res.data);
  // console.log("解析结果:", msg);

  const data = msg.getData();
  console.log("数据内容:", data);
  return JSON.stringify({
    ...data.roles,
  });
};
