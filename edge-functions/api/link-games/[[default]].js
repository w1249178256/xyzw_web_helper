import { handleGameResource } from "../../../worker.js";

export async function onRequest(context) {
  return handleGameResource(context.request ?? context);
}
