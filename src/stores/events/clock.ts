import type { EVM, XyzwSession } from ".";

export const ClockPlugin = ({ onSome, $emit }: EVM) => {
  onSome(
    ["system_claimhangupreward", "system_claimhanguprewardresp"],
    async (data: XyzwSession) => {
      const { client } = data;
      client?.debounceSend("role_getroleinfo", {});
    },
  );

  onSome(["syncresp", "system_mysharecallback"], async (data: XyzwSession) => {
    const { client } = data;
    client?.debounceSend("role_getroleinfo", {});
  });
};
