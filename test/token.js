import { Buffer } from "buffer";
import { getEnc, g_utils } from '../src/utils/bonProtocol.js'

const tokenHex = "6712831";

const reToken = (data) => {
    let enc = getEnc("auto");
    let xEnc = getEnc("x");
    let bin = enc.decrypt(data);
    let xData = xEnc.encrypt(bin);
    return xData;
}

const main = () => {
    const buf = Buffer.from(tokenHex, "hex");

    let ress = g_utils.parse(buf);
    console.log("res =", ress);

    let reTokenData = reToken(buf);
    let reTokenBase64 = Buffer.from(reTokenData, 'binary').toString("base64");
    console.log("reTokenData = :", reTokenBase64);

    // let msg = ress._raw;
    // console.log("msg =", msg);

    // const info = JSON.parse(msg.info);
    // console.log("info =", info);

    // const token = info.encryptCombUser;
    // console.log("token =", token);
    // console.log("");
    // console.log("");
    // console.log(JSON.stringify({ token }));

    // let tu = Buffer.from(token, "base64url");
    // const tu_de = g_utils.parse(tu);
    // console.log("tu_de =", tu_de);

    // const base64Token = Buffer.from(tokenHex, "hex").toString("base64url");

    // console.log("base64Token =", base64Token);
    // console.log("");
    // console.log("");
    // console.log(JSON.stringify({ token: base64Token }));

    // const bbb = ["base64", "base64url", "utf8", "ascii", "latin1", "utf16le"];
    // for (let i = 0; i < bbb.length; i++) {
    //     const text2 = buf.toString(bbb[i]);
    //     console.log("===================================");
    //     console.log(bbb[i], "\n", text2);
    // }

    // const buf2 = Buffer.from(test64, "base64url");
    // const text2 = buf2.toString("utf8");
    // console.log("\n\n\n", text2);

}

main();

