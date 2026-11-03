/** Read and authenticate a BIN without writing account data before confirmation. */
export async function prepareBinToken(file, options, dependencies) {
  if (!/\.(?:bin|dmp)$/i.test(file.name)) {
    throw new Error("仅支持 .bin 和 .dmp 文件");
  }
  const binData = await file.arrayBuffer();
  if (!binData.byteLength) throw new Error("文件内容为空");
  const id = dependencies.getTokenId(binData);
  if (options.pendingIds.has(id))
    throw new Error("本批次已读取此文件，请勿重复添加");

  dependencies.onAuthenticating();
  const token = await dependencies.transformToken(binData.slice(0));
  const meta = file.name.match(/^bin-(.*?)服-([0-2])-(\d{6,12})-(.*)\.bin$/i);
  return {
    id,
    name:
      options.name.trim() ||
      meta?.[4] ||
      file.name.replace(/\.(bin|dmp)$/i, ""),
    server: options.server.trim() || (meta ? `${meta[1]}${meta[2]}` : ""),
    wsUrl: options.wsUrl.trim(),
    token,
    importMethod: "bin",
    binData,
    error: "",
  };
}

/** Save only confirmed, authenticated files, preserving existing IDs and metadata. */
export async function saveBinToken(role, tokenStore, storeArrayBuffer) {
  const { binData, error: _error, ...tokenData } = role;
  if (!(await storeArrayBuffer(role.id, binData))) {
    throw new Error("保存 BIN 失败，请检查浏览器存储空间后重试");
  }
  const existing = tokenStore.gameTokens.find((token) => token.id === role.id);
  if (existing) {
    if (!tokenStore.updateToken(existing.id, tokenData)) {
      throw new Error("账号更新失败，请重新导入");
    }
    return "updated";
  }
  tokenStore.addToken(tokenData);
  return "added";
}
