var o = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
    return typeof o
  } : function(o) {
    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o
  },
  t = "object" === ("undefined" == typeof globalThis ? "undefined" : o(globalThis)) ? globalThis : "object" === ("undefined" == typeof window ? "undefined" : o(window)) ? window : global;
t.PLATFORM = "wx", t.SUB_PLATFORM = "", t.ENV = "Prod", t.APPID = "wx0840558555a454ed", t.CDN = "https://xxz-xyzw-res.hortorgames.com", t.SERVER = "https://xxz-xyzw.hortorgames.com", t.GAME_NAME = "咸鱼之王", t.GAME_ID = "xyzw_mix", t.GAME_VERSION = "2.3.9-wx", t.CODE_VERSION = "2.3.9", t.COMMIT_ID = "", t.CONFIG_COMMIT_ID = "", t.RESOURCES_COMMIT_ID = "", t.DOWNLOAD_URL = "", t.CDNS = ["https://xxz-xyzw-res.hortorgames.com", "https://xxz-xyzw-alires.hortorgames.com"], t.VERSION_POSTFIX = "", t.BATTLE_OSS_URL = "https://xxz-xyzw-service-battle.hortorgames.com";