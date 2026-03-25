
import { g_utils, getEnc, bon } from '@utils/bonProtocol.js'
import { Buffer } from 'buffer';

const resBase64 = "ddd=";

const main = async () => {

    const buf = Buffer.from(resBase64, "base64");

    let ress = g_utils.parse(buf);
    console.log("res =", ress);

    const tooo = ress.getData();

    console.log("tooo =", tooo);

    console.log("tooo buf =", tooo.roleToken);


}

main();
