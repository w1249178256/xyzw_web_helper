import assert from "node:assert/strict";
import test from "node:test";
import {
  BuildingType,
  BuildingTypeColor,
  CORE_PAN_CENTER,
  CORE_SURROUNDING_POINTS,
  extractValidData,
  formatPower,
  formatState,
  getLegionColor,
  HexGraph,
  roadPointList,
  typeBg,
  typeLabel,
  typeName,
  WarLegionNameColor,
} from "../src/utils/legionWar.js";
import { loadModule } from "./helpers/loadModule.js";

test("official building types and color palettes align with reverse-engineered constants", () => {
  assert.equal(BuildingType.Bronze, 1);
  assert.equal(BuildingType.Silver, 2);
  assert.equal(BuildingType.Gold, 3);
  assert.equal(BuildingType.Home, 4);
  assert.equal(BuildingType.Fort, 5);
  assert.equal(BuildingType.SaltPan, 6);
  assert.equal(BuildingType.Road, 9);

  assert.equal(WarLegionNameColor.length, 24);
  assert.equal(WarLegionNameColor[1], "#ffc43e");
  assert.equal(WarLegionNameColor[2], "#00abff");
  assert.equal(WarLegionNameColor[23], "#ff6236");

  assert.equal(BuildingTypeColor[BuildingType.SaltPan], "#1bd7d7");
  assert.equal(typeLabel(BuildingType.SaltPan), "核");
  assert.equal(typeLabel(BuildingType.Home), "本");
  assert.equal(typeName(BuildingType.SaltPan), "决战盐山");
  assert.equal(typeBg(BuildingType.Road), "#4080ff");
});

test("roadPointList contains exactly 323 unique nodes with verified central core", () => {
  assert.equal(roadPointList.length, 323);

  const ids = new Set(roadPointList.map((item) => item.id));
  assert.equal(ids.size, 323);
  assert.equal(ids.has(CORE_PAN_CENTER), true);

  for (const p of CORE_SURROUNDING_POINTS) {
    assert.equal(ids.has(p), true);
  }

  const homes = roadPointList.filter((item) => item.type === BuildingType.Home);
  assert.equal(homes.length, 20);

  const saltPan = roadPointList.find((item) => item.id === CORE_PAN_CENTER);
  assert.equal(saltPan.type, BuildingType.SaltPan);
});

test("HexGraph initializes adjacency relations based on official TMAStar hexagonal directions", () => {
  const graph = HexGraph.getInstance();
  graph.removeAllNode();

  const coreNode = graph.getNodeByCoords(CORE_PAN_CENTER);
  assert.ok(coreNode);
  assert.equal(coreNode.id, CORE_PAN_CENTER);

  const neighborIds = coreNode.neighbors.map((n) => n.id);
  for (const p of CORE_SURROUNDING_POINTS) {
    assert.equal(
      neighborIds.includes(p),
      true,
      `Core neighbor ${p} should be connected to ${CORE_PAN_CENTER}`,
    );
  }

  // Dynamic property updating on existing node ID
  graph.addNode({
    id: CORE_PAN_CENTER,
    type: BuildingType.SaltPan,
    belongsLegionId: 101,
    hP: 5000,
    maxHP: 10000,
    point: 200,
    belongsLegionInfo: { color: "#ffc43e" },
  });

  const updatedNode = graph.getNodeByCoords(CORE_PAN_CENTER);
  assert.equal(updatedNode.belongsLegionId, 101);
  assert.equal(updatedNode.hP, 5000);
  assert.equal(updatedNode.colorBg, "#ffc43e");

  // Path finding between connected nodes
  const path = graph.findShortestPath("20_17", "20_16", 101);
  assert.ok(Array.isArray(path));
  assert.equal(path.length, 2);
  assert.equal(path[0].id, "20_17");
  assert.equal(path[1].id, "20_16");
});

test("extractValidData cleans raw battlefield server payload and calculates metrics accurately", () => {
  assert.equal(extractValidData(null), false);
  assert.equal(extractValidData({}), false);

  const mockPayload = {
    battlefield: {
      buildingData: {
        "20_17": { id: "20_17", type: 6, belongsLegionId: 1, point: 100 },
        "7_4": { id: "7_4", type: 4, belongsLegionId: 1, point: 30 },
      },
      legions: {
        1: {
          id: 1,
          name: "测试俱乐部",
          color: 1,
          level: 10,
          serverId: 1001,
          blessingScore: 50,
          blessingIdList: [1, 2],
          buildings: { "20_17": 1, "7_4": 1 },
          membersV2: { 101: {}, 102: {} },
          power: 88880000,
        },
      },
      roles: {
        101: {
          name: "玩家A",
          legionID: 1,
          isOnline: true,
          state: "march",
          aB: 5,
          killCnt: 10,
          revive: 2,
          d: 8,
          point: 500,
        },
      },
    },
  };

  const extracted = extractValidData(mockPayload);
  assert.ok(extracted);

  const legion = extracted.legionInfo[1];
  assert.equal(legion.name, "测试俱乐部");
  assert.equal(legion.color, WarLegionNameColor[1]);
  assert.equal(legion.score, 180); // 100 + 30 + 50
  assert.equal(legion.OnlineCount, 1);
  assert.equal(legion.participantsCount, 1);
  assert.equal(legion.reviveCount, 2);
  assert.equal(legion.danCount, 2); // 8 - 6 = 2

  const member = extracted.memberInfo[0];
  assert.equal(member.name, "玩家A");
  assert.equal(member.lastState, "行进");
  assert.equal(member.dan, 2);
});

test("helper formatters output expected labels", () => {
  assert.equal(getLegionColor(1), WarLegionNameColor[1]);
  assert.equal(formatState("idle"), "空闲");
  assert.equal(formatState("over"), "死亡");
  assert.equal(formatState("unknown"), "未知");

  assert.equal(formatPower(0), "0");
  assert.equal(formatPower(50000), "5.00万");
  assert.equal(formatPower(120000000), "1.20亿");
});

test("XyzwLegionWarWebSocketClient registers official battle commands and builds packets", async () => {
  const logger = {
    info() {},
    verbose() {},
    wsMessage() {},
    warn() {},
    error() {},
  };
  const utils = {
    bon: {
      encode(val) {
        return val;
      },
    },
    getEnc() {
      return null;
    },
  };
  const dependencies = {
    "@/stores/cache": {
      $CacheManager: {
        getCache() {
          return {};
        },
      },
    },
    "./bonProtocol.js": { g_utils: utils },
    "./logger.js": { gameLogger: logger, wsLogger: logger },
    "./helperTaskRunner.js": { sleep: async () => {} },
  };
  const globals = {
    WebSocket: { OPEN: 1 },
    setTimeout: () => 1,
    clearTimeout: () => {},
    setInterval: () => 1,
    clearInterval: () => {},
  };

  const exports = await loadModule(
    new URL("../src/utils/xyzwLegionWarWebSocket.js", import.meta.url),
    dependencies,
    globals,
  );

  const client = new exports.XyzwLegionWarWebSocketClient({
    url: "wss://test.hortorgames.com",
    hint: "bf_1001",
    utils,
  });

  // 1. 验证命令注册完整性
  const expectedCmds = [
    "war_startbattle",
    "war_startattackbuilding",
    "war_startmarch",
    "war_setbattleteam",
    "war_suicide",
    "war_speedup",
    "war_getteaminfo",
    "war_getbattlefieldinfo",
    "war_enterbattlefield",
  ];

  for (const cmd of expectedCmds) {
    assert.equal(
      client.registry.commands.has(cmd),
      true,
      `Command ${cmd} should be registered in legion war client`,
    );
  }

  // 2. 验证 war_startbattle 报文结构
  const battlePacket = client.registry.build("war_startbattle", 1, 2, {
    battlefieldId: "bf_1001",
    targetCodeId: 20001,
  });
  assert.equal(battlePacket.cmd, "war_startbattle");
  assert.equal(battlePacket.seq, 2);
  assert.deepEqual(JSON.parse(JSON.stringify(battlePacket.body)), {
    battlefieldId: "bf_1001",
    targetCodeId: 20001,
  });

  // 3. 验证 war_startattackbuilding 报文结构
  const attackPacket = client.registry.build("war_startattackbuilding", 2, 3, {
    battlefieldId: "bf_1001",
    buildingId: "20_17",
  });
  assert.equal(attackPacket.cmd, "war_startattackbuilding");
  assert.deepEqual(JSON.parse(JSON.stringify(attackPacket.body)), {
    battlefieldId: "bf_1001",
    buildingId: "20_17",
  });

  // 4. 验证 war_setbattleteam 报文结构
  const teamPacket = client.registry.build("war_setbattleteam", 3, 4, {
    battlefieldId: "bf_1001",
    battleTeam: [{ heroId: 101, pos: 1 }],
    lordWeaponId: 1,
    petUId: "pet_123",
  });
  assert.equal(teamPacket.cmd, "war_setbattleteam");
  assert.deepEqual(JSON.parse(JSON.stringify(teamPacket.body)), {
    battlefieldId: "bf_1001",
    battleTeam: [{ heroId: 101, pos: 1 }],
    lordWeaponId: 1,
    petUId: "pet_123",
  });
});

