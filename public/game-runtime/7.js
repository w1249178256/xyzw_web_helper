// ==UserScript==
// @name         战斗实时数值
// @namespace    xyzw
// @version      1.3.0
// @description  战斗实时数值显示（攻/盾）
// @match        *://*/*
// @noframes
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

(function anonymous(
) {
/**
 * 战斗实时数值 — 系统脚本版
 * 核心：open_xyzw CDN main.js v1.0.9 提取「战斗数值.js」
 *   - CompAttributes 旁路 + ATTACK_FIGHTING 影子模型（实时攻击）
 *   - SystemHeadBoard._updateLifeAndRage + onFrame（~180ms 节流）
 *   - 攻/盾合并：「攻:x / 盾:y」；可选 GRoot 置顶
 * 对接：
 *   localStorage.__battle_numeric_display_enabled（'1'/'0'）
 *   postMessage SET_BATTLE_NUMERIC_DISPLAY
 *   __gmmBattleHud / __applyBattleNumericDisplay
 */
(function () {
  'use strict';

  var pageWindow =
    typeof unsafeWindow !== 'undefined' && unsafeWindow ? unsafeWindow : window;

  function forceOffHeroAttrCompanion() {
    try {
      localStorage.setItem('__battle_hero_attr_debug_enabled', '0');
    } catch (_) {}
    try {
      if (typeof pageWindow.__applyBattleHeroAttrDebug === 'function') {
        pageWindow.__applyBattleHeroAttrDebug(false);
      }
    } catch (_) {}
  }

  function unwrapSdkHooks() {
    try {
      var r = pageWindow.__require || pageWindow.require;
      if (typeof r !== 'function') return;
      var system = r('system-head-board');
      var SystemHeadBoard = system && (system.SystemHeadBoard || system.default);
      var proto = SystemHeadBoard && SystemHeadBoard.prototype;
      if (proto) {
        ['_updateLifeAndRage', 'onFrame', '_updateBuffSlot']
          .map(function (s) {
            return s.trim();
          })
          .forEach(function (name) {
            var guard = 0;
            var fn = proto[name];
            while (
              fn &&
              guard < 8 &&
              (fn.__sdkBattleEnhanceOriginal ||
                fn.__llBattleNumericOriginal ||
                fn.__llBattleNumericBuffOriginal ||
                fn.__sdkBattleEnhanceOriginal)
            ) {
              proto[name] =
                fn.__sdkBattleEnhanceOriginal ||
                fn.__llBattleNumericOriginal ||
                fn.__llBattleNumericBuffOriginal;
              fn = proto[name];
              guard += 1;
            }
          });
      }
      var ids = ['comp-attributes', '../attribute/component/comp-attributes'];
      for (var i = 0; i < ids.length; i++) {
        try {
          var mod = r(ids[i]);
          var Comp = mod && (mod.CompAttributes || mod.default);
          var ap = Comp && Comp.prototype;
          if (!ap) continue;
          Object.getOwnPropertyNames(ap).forEach(function (name) {
            var fn = ap[name];
            if (
              fn &&
              typeof fn === 'function' &&
              fn.__sdkBattleEnhanceOriginal
            ) {
              ap[name] = fn.__sdkBattleEnhanceOriginal;
            }
          });
        } catch (_) {}
      }
    } catch (_) {}
  }

  function teardownPrevious() {
    try {
      if (typeof pageWindow.__teardownBattleNumericDisplay === 'function') {
        pageWindow.__teardownBattleNumericDisplay();
      }
    } catch (_) {}
    unwrapSdkHooks();
    try {
      delete pageWindow.__GMM_STANDALONE_BATTLE_HUD__;
    } catch (_) {
      pageWindow.__GMM_STANDALONE_BATTLE_HUD__ = false;
    }
    try {
      delete pageWindow.__BATTLE_NUMERIC_DISPLAY__;
    } catch (_) {
      pageWindow.__BATTLE_NUMERIC_DISPLAY__ = false;
    }
  }

  teardownPrevious();
  forceOffHeroAttrCompanion();


    var pageWindow = (typeof unsafeWindow !== 'undefined' && unsafeWindow) ? unsafeWindow : window;
    // reinject handled by outer bootstrap
    pageWindow.__GMM_STANDALONE_BATTLE_HUD__ = true;
    pageWindow.__BATTLE_NUMERIC_DISPLAY__ = true;

    // CDN 原脚本里的页面全局对象
    var _0x5e8731 = pageWindow;
    // 字符串解码器已内联；保留空壳防止残留调用报错
    function _0x555c() { return ''; }
    var _0x3b1178 = _0x555c;
    var _0x34e8f0 = _0x555c;

const _0x14eade='sdk_battle_enhance_enabled',_0x3a5cce='sdk_battle_enhance_top_layer',_0x3e4c99='__sdkBattleEnhanceFields',_0x57ba8c=10000,_0x4e210b=180,_0x44fa3d=500;let _0x48c649=true,_0x29ee7c=![],_0x493383=null;const _0x5d65f9=new Set(),_0x22908a=new WeakSet(),_0x929428=new WeakMap(),_0x4cd848=new WeakMap(),_0x430433=new WeakMap(),_0x969e06=[],_0xbcac12=600000;let _0x5f0d99=null,_0x194eff=[],_0x37f103=![];const _0x371267=new Set();let _0x22389a=null,_0x3c977a=0,_0x463b01=null;try{const _0x4e2a1d=localStorage['getItem']('__battle_numeric_display_enabled'),_0x3b7c2e=localStorage['getItem'](_0x14eade);_0x48c649=_0x4e2a1d!=='0'&&_0x3b7c2e!=='false';}catch(_0x2af24a){}try{_0x29ee7c=localStorage['getItem']('__battle_numeric_display_top_layer')==='1'||localStorage['getItem'](_0x3a5cce)==='true';}catch(_0x5ab1ff){}try{const _0x8c2b21=_0x5e8731['document']&&_0x5e8731['document']['getElementById']('sdk-battle-attribute-panel');if(_0x8c2b21)_0x8c2b21['remove']();}catch(_0x3cecce){}function _0x4d7c14(_0x226c85){var _0x2f00e6=_0x3b1178;try{if(_0x226c85&&typeof _0x226c85["toNumber"]==="function")_0x226c85=_0x226c85["toNumber"]();else{if(_0x226c85&&typeof _0x226c85['toFixed']==="function"&&typeof _0x226c85!=='number')_0x226c85=_0x226c85["toFixed"]();}const _0x10c5e5=Number(_0x226c85);return Number['isFinite'](_0x10c5e5)?_0x10c5e5:0;}catch(_0x198efc){return 0;}}function _0x3fb940(_0x152204,_0x1c4ea8,_0x492583){var _0xe854e3=_0x3b1178;let _0x8fb268=Math['max'](0,_0x4d7c14(_0x152204));const _0x19cdd6=Math["max"](1,Number(_0x1c4ea8)||4),_0x215611=[{'value':0xe8d4a51000,'name':'兆'},{'value':0x5f5e100,'name':'亿'},{'value':10000,'name':'万'}];let _0x3a8e4a='',_0x4295c3=1;for(let _0xad1801=0;_0xad1801<_0x215611['length'];_0xad1801++){if(_0x8fb268>=_0x215611[_0xad1801]["value"]){_0x4295c3=_0x215611[_0xad1801]["value"],_0x3a8e4a=_0x215611[_0xad1801]["name"];break;}}function _0x51f7a8(_0x16974b){var _0x2b6efd=_0xe854e3;if(_0x16974b===0)return'0';const _0x428a18=Math['floor'](Math['log10'](Math["abs"](_0x16974b))),_0x4a1a05=Math['pow'](10,_0x19cdd6-1-_0x428a18),_0x6ff186=Math["round"](_0x16974b*_0x4a1a05)/_0x4a1a05,_0x939e56=Math["floor"](Math['log10'](Math['abs'](_0x6ff186))),_0x2204d8=Math["max"](0,_0x19cdd6-1-_0x939e56);let _0x37a326=_0x6ff186['toFixed'](_0x2204d8);if(_0x37a326["indexOf"]('.')>=0)_0x37a326=_0x37a326['replace'](/0+$/,'')["replace"](/\.$/,'');return _0x37a326;}let _0x5a9296=_0x8fb268/_0x4295c3,_0x296e60=_0x51f7a8(_0x5a9296);if(_0x3a8e4a&&Number(_0x296e60)>=10000){const _0x5517d1=_0x215611['findIndex'](function(_0x170194){return _0x170194['name']===_0x3a8e4a;}),_0xb52c48=_0x5517d1>0?_0x215611[_0x5517d1-1]:null;_0xb52c48&&(_0x5a9296=_0x8fb268/_0xb52c48["value"],_0x296e60=_0x51f7a8(_0x5a9296),_0x3a8e4a=_0xb52c48["name"]);}return _0x296e60+(_0x492583?_0x3a8e4a:'');}function _0x533965(_0x276ec1,_0x19fc68,_0x1cb5b6){var _0x2f5f32=_0x3b1178;const _0x41b771=new _0x276ec1['GTextField']();_0x41b771['name']=_0x19fc68,_0x41b771["sortingOrder"]=_0x57ba8c,_0x41b771['fontSize']=16,_0x41b771["bold"]=!![],_0x41b771['color']=_0x1cb5b6,_0x41b771["singleLine"]=!![],_0x41b771['touchable']=![];try{_0x41b771['autoSize']=_0x276ec1['AutoSizeType']?_0x276ec1["AutoSizeType"]["None"]:0;}catch(_0x27035c){}return _0x41b771['stroke']=0,_0x41b771;}function _0x216025(_0x1004cd){var _0x465434=_0x3b1178;if(!_0x1004cd||_0x1004cd['isDisposed'])return;try{_0x1004cd["sortingOrder"]=_0x29ee7c?_0x57ba8c:0;}catch(_0x5a4812){}}function _0x27da1a(){var _0x102a65=_0x3b1178;try{const _0x4ed56f=_0x5e8731["fgui"]&&_0x5e8731['fgui']["GRoot"],_0x21f1cf=_0x4ed56f&&(_0x4ed56f['inst']||_0x4ed56f['instance']);return _0x21f1cf&&typeof _0x21f1cf['addChild']==='function'?_0x21f1cf:null;}catch(_0x48a8c1){return null;}}function _0x5aa571(_0x199fc5){var _0x12df2a=_0x3b1178;if(_0x29ee7c)return _0x27da1a();return _0x199fc5&&typeof _0x199fc5["addChild"]==="function"?_0x199fc5:null;}function _0x4c56b1(_0x924f1f,_0x33c759){var _0x48deb4=_0x3b1178;if(!_0x924f1f||_0x924f1f["isDisposed"]||!_0x33c759)return![];try{if(_0x924f1f['parent']!==_0x33c759){if(typeof _0x924f1f['removeFromParent']==='function')_0x924f1f['removeFromParent']();_0x33c759["addChild"](_0x924f1f);}return _0x216025(_0x924f1f),!![];}catch(_0x3188ea){return![];}}function _0xdec0a(_0x43fb32,_0x10a393){var _0x41595b=_0x3b1178;if(!_0x43fb32||_0x43fb32['isDisposed'])return;_0x216025(_0x43fb32);let _0x2c2586='#FFFFFF',_0x35e1f4='#000000';try{const _0x2037d9=_0x5e8731['cc']&&_0x5e8731['cc']["Color"];_0x2037d9&&(_0x2c2586=_0x2037d9["WHITE"]||new _0x2037d9(255,255,255,255),_0x35e1f4=_0x2037d9['BLACK']||new _0x2037d9(0,0,0,255));}catch(_0x267187){}_0x43fb32["color"]=_0x2c2586,_0x43fb32['text']=_0x10a393||'',_0x43fb32["grayed"]=![],_0x43fb32['stroke']=2;try{_0x43fb32['strokeColor']=_0x35e1f4;}catch(_0x314c05){}try{const _0x4f240e=_0x5e8731['cc']&&_0x5e8731['cc']['Color'],_0x5ca6e3=_0x4f240e&&(_0x4f240e["WHITE"]||new _0x4f240e(255,255,255,255)),_0x50dc64=_0x4f240e&&(_0x4f240e['BLACK']||new _0x4f240e(0,0,0,255)),_0x340487=_0x43fb32["_textField"]||_0x43fb32["textField"]||null;if(_0x340487&&_0x5ca6e3){_0x340487['color']=_0x5ca6e3;if(_0x340487['node'])_0x340487["node"]['color']=_0x5ca6e3;}_0x340487&&(_0x340487['enableOutline']=!![],_0x340487["_enableOutline"]=!![],_0x50dc64&&(_0x340487["outlineColor"]=_0x50dc64,_0x340487['_outlineColor']=_0x50dc64),_0x340487['outlineWidth']=2,_0x340487['_outlineWidth']=2);}catch(_0x3fabae){}}function _0xf5bb8d(_0x77f8a,_0x505380,_0x4a323c,_0x538929,_0x53da76,_0x375b86,_0x44e438){var _0x28546a=_0x3b1178;if(!_0x77f8a||_0x77f8a["isDisposed"])return;const _0x25aa31=Math["round"](_0x4a323c),_0x46dfda=Math["round"](_0x538929),_0x1496cf=Math["max"](1,Math["round"](_0x53da76)),_0x40e0db=Math['max'](1,Math["round"](_0x375b86)),_0x14b033=[_0x505380||'',_0x25aa31,_0x46dfda,_0x1496cf,_0x40e0db,_0x44e438||'']["join"]('|');if(_0x77f8a["__sdkBattleEnhanceRenderKey"]===_0x14b033)return;_0x77f8a['__sdkBattleEnhanceRenderKey']=_0x14b033;try{_0x77f8a["autoSize"]=_0x5e8731["fgui"]["AutoSizeType"]?_0x5e8731["fgui"]['AutoSizeType']['None']:0;}catch(_0x4cb014){}_0x77f8a['setPosition'](_0x25aa31,_0x46dfda),_0x77f8a["setSize"](_0x1496cf,_0x40e0db),_0x77f8a["align"]=_0x44e438,_0xdec0a(_0x77f8a,_0x505380);}function _0x4334ec(_0x425691){var _0x45714c=_0x3b1178;if(!_0x425691||!_0x5e8731['fgui']||!_0x5e8731['fgui']['GTextField'])return null;const _0x8c5f15=_0x5aa571(_0x425691);if(!_0x8c5f15)return null;let _0x9b2020=_0x425691[_0x3e4c99];if(_0x9b2020&&_0x9b2020['hp']&&!_0x9b2020['hp']['isDisposed']){['shield',"attack"]['forEach'](function(_0x512d32){var _0x580c38=_0x45714c;const _0x25b554=_0x9b2020[_0x512d32];try{if(!_0x25b554||_0x25b554["isDisposed"])return;if(typeof _0x25b554['removeFromParent']==='function')_0x25b554['removeFromParent']();if(typeof _0x25b554['dispose']==='function')_0x25b554['dispose']();}catch(_0x2c0f17){}}),delete _0x9b2020["shield"],delete _0x9b2020["attack"];if(!_0x9b2020['stats']||_0x9b2020["stats"]['isDisposed'])try{_0x9b2020['stats']=_0x533965(_0x5e8731['fgui'],'sdkBattleStatsText',"#000000");}catch(_0x4a0084){return null;}if(!_0x4c56b1(_0x9b2020['hp'],_0x8c5f15)||!_0x4c56b1(_0x9b2020["rage"],_0x8c5f15)||!_0x4c56b1(_0x9b2020['stats'],_0x8c5f15))return null;return _0x5d65f9['add'](_0x425691),_0x9b2020;}const _0x3478e5=_0x5e8731["fgui"];_0x9b2020={'hp':_0x533965(_0x3478e5,'sdkBattleHpText',"#000000"),'rage':_0x533965(_0x3478e5,"sdkBattleRageText",'#000000'),'stats':_0x533965(_0x3478e5,'sdkBattleStatsText','#000000')};try{if(!_0x4c56b1(_0x9b2020['hp'],_0x8c5f15)||!_0x4c56b1(_0x9b2020["rage"],_0x8c5f15)||!_0x4c56b1(_0x9b2020['stats'],_0x8c5f15))return null;return _0x425691[_0x3e4c99]=_0x9b2020,_0x5d65f9["add"](_0x425691),_0x9b2020;}catch(_0x583461){return null;}}function _0x3ff7db(_0x4ea316,_0x188143){if(!_0x4ea316)return;Object['keys'](_0x4ea316)['forEach'](function(_0xf2a75f){var _0x325ba2=_0x555c;try{if(_0x4ea316[_0xf2a75f]&&!_0x4ea316[_0xf2a75f]['isDisposed']&&_0x4ea316[_0xf2a75f]["visible"]!==!!_0x188143)_0x4ea316[_0xf2a75f]["visible"]=!!_0x188143;}catch(_0x541cdb){}});}function _0x170de7(_0x1f4602,_0x1849aa){var _0x1c18cb=_0x3b1178;try{const _0x3037f8=_0x1849aa&&(_0x1849aa["CompArmorAssistant"]||_0x1849aa['default']),_0x325ed8=_0x3037f8&&_0x1f4602["getComponent"](_0x3037f8);return _0x325ed8&&typeof _0x325ed8["getAllArmor"]==="function"?_0x4d7c14(_0x325ed8['getAllArmor']()):0;}catch(_0x15948c){return 0;}}function _0x5af463(_0x59b72a,_0x35f345,_0x117b87){var _0x44ce6b=_0x3b1178;if(!_0x59b72a)return null;const _0xac5f85=function(_0x3a49c9){var _0x19275e=_0x555c;try{if(!_0x3a49c9||!_0x3a49c9['_attributes'])return![];if(_0x117b87===undefined||_0x117b87===null)return Object['keys'](_0x3a49c9["_attributes"])['length']>0;return!!_0x3a49c9["_attributes"][_0x117b87];}catch(_0x465eb1){return![];}};try{const _0x4afd42=_0x929428['get'](_0x59b72a);if(_0xac5f85(_0x4afd42))return _0x4cd848["set"](_0x4afd42,_0x59b72a),_0x4afd42;}catch(_0x553367){}try{const _0x36ff6d=_0x35f345&&(_0x35f345["CompAttributes"]||_0x35f345["default"]),_0xb76767=_0x36ff6d&&_0x59b72a["getComponent"](_0x36ff6d);if(_0xac5f85(_0xb76767))return _0x929428['set'](_0x59b72a,_0xb76767),_0x4cd848['set'](_0xb76767,_0x59b72a),_0xb76767;}catch(_0x39baa7){}return null;}function _0x53f0d7(_0xf52836,_0x4840b3){var _0x31a7d7=_0x3b1178;try{if(!_0xf52836||_0x4840b3===undefined||_0x4840b3===null)return null;const _0x412632=_0xf52836['_attributes']&&_0xf52836['_attributes'][_0x4840b3],_0x3e8b0b=_0x412632&&[_0x412632["validValue"],_0x412632["finalValue"],_0x412632['value'],_0x412632["currentValue"],_0x412632];if(_0x3e8b0b)for(let _0x5729b2=0;_0x5729b2<_0x3e8b0b["length"];_0x5729b2++){const _0x5ec609=_0x5ae6ca(_0x3e8b0b[_0x5729b2]);if(Number["isFinite"](_0x5ec609))return _0x5ec609;}if(typeof _0xf52836["_get"]==="function"){const _0x1fd7d8=_0x5ae6ca(_0xf52836['_get'](_0x4840b3));if(Number['isFinite'](_0x1fd7d8))return _0x1fd7d8;}}catch(_0x4e3ed4){}return null;}function _0x1bfb27(_0x25fc72,_0x4cf448){var _0x2ddef4=_0x3b1178;try{const _0x289663=_0x4cf448||{},_0x548d8a=_0x289663['ATTACK_FIGHTING']!==undefined?_0x289663['ATTACK_FIGHTING']:11,_0x5a1ff3=_0x53f0d7(_0x25fc72,_0x548d8a);if(_0x5a1ff3!==null&&_0x5a1ff3>0)return _0x5a1ff3;const _0x490d99=_0x53f0d7(_0x25fc72,_0x289663["ATTACK_ABS"]),_0x5c5f76=_0x53f0d7(_0x25fc72,_0x289663["ATTACK"]);if(_0x490d99!==null&&_0x490d99>0&&_0x5c5f76!==null)return Math["max"](0,_0x490d99*(1+_0x5c5f76));}catch(_0x48a337){}return null;}function _0x5ae6ca(_0x10b48d){var _0xbf431f=_0x3b1178;try{if(_0x10b48d&&typeof _0x10b48d["toNumber"]==='function')_0x10b48d=_0x10b48d["toNumber"]();const _0x5d8536=Number(_0x10b48d);return Number['isFinite'](_0x5d8536)?_0x5d8536:NaN;}catch(_0x2bd7e3){return NaN;}}function _0x39644e(_0x2cc862){var _0x50d6ab=_0x3b1178;if(!_0x2cc862)return NaN;const _0x3c3418=[_0x2cc862['validValue'],_0x2cc862["_validValue"],_0x2cc862["finalValue"],_0x2cc862["value"],_0x2cc862["currentValue"],_0x2cc862];for(let _0x10328a=0;_0x10328a<_0x3c3418['length'];_0x10328a++){const _0x98f350=_0x5ae6ca(_0x3c3418[_0x10328a]);if(Number["isFinite"](_0x98f350))return _0x98f350;}return NaN;}function _0x56654d(_0x5d1173){var _0x5e21a8=_0x3b1178;let _0x34c66d=_0x5ae6ca(_0x5d1173&&(_0x5d1173["baseValue"]!==undefined?_0x5d1173['baseValue']:_0x5d1173['_baseValue'])),_0x4b5fcf=_0x5ae6ca(_0x5d1173&&(_0x5d1173["addScaleValue"]!==undefined?_0x5d1173['addScaleValue']:_0x5d1173["_addScaleValue"])),_0x29555b=_0x5ae6ca(_0x5d1173&&(_0x5d1173['addAbsoluteValue']!==undefined?_0x5d1173['addAbsoluteValue']:_0x5d1173['_addAbsoluteValue']));const _0x34d30b=_0x39644e(_0x5d1173);if(!Number["isFinite"](_0x34c66d))_0x34c66d=Number['isFinite'](_0x34d30b)?_0x34d30b:0;if(!Number['isFinite'](_0x4b5fcf))_0x4b5fcf=0;if(!Number['isFinite'](_0x29555b))_0x29555b=0;return{'base':_0x34c66d,'scale':_0x4b5fcf,'absolute':_0x29555b,'valid':0};}function _0x200a3e(_0x425106){var _0x1c1ecd=_0x3b1178;if(!_0x425106)return 0;const _0x782e0b=_0x425106["base"]*(1+_0x425106['scale'])+_0x425106['absolute'];return _0x425106["valid"]=Number["isFinite"](_0x782e0b)?_0x782e0b:0,_0x425106['valid'];}function _0x356b4e(_0x5c8881,_0x38f71c){var _0x3f7598=_0x3b1178;const _0x2c40d8=Date['now']();for(let _0x171b49=_0x969e06["length"]-1;_0x171b49>=0;_0x171b49--){const _0x394baf=_0x969e06[_0x171b49];if(!_0x394baf||_0x2c40d8-_0x394baf["updatedAt"]>_0xbcac12){_0x969e06["splice"](_0x171b49,1);continue;}if(_0x394baf['entity']!==_0x5c8881)continue;if(_0x38f71c&&_0x394baf['attributes']&&_0x394baf['attributes']!==_0x38f71c){_0x969e06['splice'](_0x171b49,1);continue;}return _0x394baf;}return null;}function _0x6dfb65(_0x5e7bd1,_0x43b96c){var _0x3f3626=_0x3b1178;let _0x19d4b4=_0x356b4e(_0x5e7bd1,_0x43b96c);if(_0x19d4b4)return _0x19d4b4;return _0x19d4b4={'entity':_0x5e7bd1,'attributes':_0x43b96c||null,'attack':NaN,'shadow':null,'updatedAt':Date["now"]()},_0x969e06['push'](_0x19d4b4),_0x19d4b4;}function _0x8c58e0(_0x37940c,_0x3cba20,_0x1e7bc4){var _0x2ee60d=_0x3b1178;_0x37940c['attributes']&&_0x37940c['attributes']!==_0x3cba20&&(_0x37940c["attributes"]=_0x3cba20,_0x37940c["attack"]=NaN,_0x37940c['shadow']=null);if(_0x37940c['shadow'])return _0x37940c['shadow'];const _0x4d80b7=_0x1e7bc4||{},_0x13013c=_0x4d80b7["ATTACK_ABS"],_0x2e8882=_0x4d80b7['ATTACK'],_0x2a7a7=_0x4d80b7["ATTACK_FIGHTING"]!==undefined?_0x4d80b7["ATTACK_FIGHTING"]:11,_0x566cdb={'attackAbs':_0x56654d(_0x3cba20&&_0x3cba20['_attributes']&&_0x3cba20['_attributes'][_0x13013c]),'attack':_0x56654d(_0x3cba20&&_0x3cba20['_attributes']&&_0x3cba20["_attributes"][_0x2e8882]),'fighting':_0x56654d(_0x3cba20&&_0x3cba20["_attributes"]&&_0x3cba20["_attributes"][_0x2a7a7])};_0x200a3e(_0x566cdb["attackAbs"]),_0x200a3e(_0x566cdb["attack"]),_0x200a3e(_0x566cdb["fighting"]);const _0x196219=_0x566cdb["attackAbs"]["valid"]*(1+_0x566cdb['attack']["valid"]);return _0x566cdb["fighting"]['valid']===0&&_0x196219!==0&&(_0x566cdb["fighting"]['base']=_0x196219,_0x200a3e(_0x566cdb['fighting'])),_0x37940c['attributes']=_0x3cba20,_0x37940c['shadow']=_0x566cdb,_0x37940c["attack"]=_0x566cdb["fighting"]["valid"]>0?_0x566cdb['fighting']['valid']:NaN,_0x566cdb;}function _0x22123c(_0x82198){var _0x8a9bdb=_0x3b1178;if(!_0x82198||!_0x82198['entity']||!Number['isFinite'](_0x82198['attack']))return;_0x82198['updatedAt']=Date['now']();const _0x3735de=Math['max'](0,_0x82198["attack"]);_0x430433['set'](_0x82198["entity"],_0x3735de),_0x311aab(_0x82198['entity']);}function _0x2f1f12(_0x2f9f42,_0x3f8ad8,_0x23812e,_0x555db1,_0x14ce54){var _0x1a8083=_0x3b1178;try{const _0x185584=_0x301313(),_0x3fddc2=_0x463b01||_0x185584['battleAttributeKey']||{},_0x225cbd=_0x30e996(_0x4cd848["get"](_0x2f9f42)||_0x2f9f42["entity"]||_0x2f9f42['actor']),_0x4a2b2a=_0x5ae6ca(_0x555db1);if(!_0x225cbd||!Number["isFinite"](_0x4a2b2a))return;const _0x1e7064=[_0x3fddc2["ATTACK_ABS"],_0x3fddc2['ATTACK'],_0x3fddc2["ATTACK_FIGHTING"]!==undefined?_0x3fddc2["ATTACK_FIGHTING"]:11];if(!_0x1e7064["some"](function(_0x547f1b){return _0x547f1b!==undefined&&String(_0x547f1b)===String(_0x23812e);}))return;_0x4cd848['set'](_0x2f9f42,_0x225cbd);const _0x5b490e=_0x6dfb65(_0x225cbd,_0x2f9f42),_0xdd55db=_0x8c58e0(_0x5b490e,_0x2f9f42,_0x3fddc2);let _0x2c14ff=null;if(String(_0x23812e)===String(_0x3fddc2["ATTACK_ABS"]))_0x2c14ff=_0xdd55db['attackAbs'];else{if(String(_0x23812e)===String(_0x3fddc2['ATTACK']))_0x2c14ff=_0xdd55db["attack"];else _0x2c14ff=_0xdd55db["fighting"];}if(_0x3f8ad8==='resetBase')_0x2c14ff["base"]=_0x4a2b2a,_0x14ce54&&(_0x2c14ff["scale"]=0,_0x2c14ff['absolute']=0);else{if(_0x3f8ad8==='resetAddAbsolute')_0x2c14ff["absolute"]=_0x4a2b2a;else{if(_0x3f8ad8==='addAbsolute')_0x2c14ff["absolute"]+=_0x4a2b2a;else{if(_0x3f8ad8==="addScale")_0x2c14ff['scale']+=_0x4a2b2a;else return;}}}_0x200a3e(_0x2c14ff),_0x2c14ff!==_0xdd55db["fighting"]&&(_0xdd55db['fighting']['base']=_0xdd55db['attackAbs']['valid']*(1+_0xdd55db['attack']['valid']),_0x200a3e(_0xdd55db["fighting"])),_0xdd55db['fighting']['valid']>0&&(_0x5b490e["attack"]=_0xdd55db["fighting"]['valid'],_0x22123c(_0x5b490e));}catch(_0x2e4d4a){}}function _0x55ba99(_0x6cc258,_0x5ef0ba,_0x807af){var _0x55761e=_0x3b1178;try{const _0x4430ef=_0x301313(),_0x15932f=_0x463b01||_0x4430ef['battleAttributeKey']||{},_0x4a3172=_0x15932f["ATTACK_FIGHTING"]!==undefined?_0x15932f["ATTACK_FIGHTING"]:11;if(String(_0x5ef0ba)!==String(_0x4a3172))return;const _0x3caa62=_0x30e996(_0x4cd848['get'](_0x6cc258)||_0x6cc258['entity']||_0x6cc258["actor"]),_0x460a7a=_0x5ae6ca(_0x807af);if(!_0x3caa62||!Number["isFinite"](_0x460a7a)||_0x460a7a<=0)return;const _0x1a45a0=_0x6dfb65(_0x3caa62,_0x6cc258),_0x5c741a=_0x8c58e0(_0x1a45a0,_0x6cc258,_0x15932f),_0x474326=1+_0x5c741a['fighting']['scale'];if(Math["abs"](_0x474326)>1e-12)_0x5c741a["fighting"]['base']=(_0x460a7a-_0x5c741a["fighting"]["absolute"])/_0x474326;else _0x5c741a["fighting"]['base']=0,_0x5c741a["fighting"]['absolute']=_0x460a7a;_0x200a3e(_0x5c741a["fighting"]),_0x5c741a["fighting"]['valid']>0&&(_0x1a45a0['attack']=_0x5c741a["fighting"]['valid'],_0x22123c(_0x1a45a0));}catch(_0xc05e16){}}function _0x39d7e9(_0x5d44d6){var _0x59e53f=_0x3b1178;try{const _0x512ee8=_0x301313(),_0x1e3fd8=_0x463b01||_0x512ee8['battleAttributeKey']||{},_0x13287d=_0x30e996(_0x4cd848["get"](_0x5d44d6)||_0x5d44d6["entity"]||_0x5d44d6["actor"]);if(!_0x13287d)return;_0x4cd848["set"](_0x5d44d6,_0x13287d);const _0x228472=_0x356b4e(_0x13287d,_0x5d44d6);if(_0x228472&&Number["isFinite"](_0x228472['attack'])){_0x22123c(_0x228472);return;}const _0x498201=_0x6dfb65(_0x13287d,_0x5d44d6),_0x1629c7=_0x8c58e0(_0x498201,_0x5d44d6,_0x1e3fd8),_0x228ec4=_0x1bfb27(_0x5d44d6,_0x1e3fd8);if(_0x228ec4!==null&&Number['isFinite'](_0x228ec4)&&_0x228ec4>0){_0x1629c7["fighting"]['base']=_0x228ec4,_0x1629c7['fighting']['scale']=0,_0x1629c7['fighting']["absolute"]=0,_0x200a3e(_0x1629c7["fighting"]),_0x498201["attack"]=_0x228ec4,_0x22123c(_0x498201);return;}_0x498201['attack']=NaN;}catch(_0x6400c0){}}function _0xa51a44(_0x3fa0dd,_0x2be459){var _0x10f3a8=_0x3b1178;if(typeof _0x3fa0dd!=="function")return null;for(let _0x3bf9f3=0;_0x3bf9f3<_0x2be459['length'];_0x3bf9f3++){try{const _0x351b61=_0x3fa0dd(_0x2be459[_0x3bf9f3]);if(_0x351b61)return _0x351b61;}catch(_0x147822){}}return null;}function _0x301313(){var _0x1b9d98=_0x3b1178;const _0x5d6678={'attributes':null,'battleAttributeKey':null};try{const _0x500bdf=_0x5e8731['__require']&&_0x5e8731['__require']['m'];if(!_0x500bdf)return _0x5d6678;Object['keys'](_0x500bdf)["some"](function(_0x2564c5){var _0x3afd7c=_0x1b9d98;const _0x39488d=_0x500bdf[_0x2564c5]&&_0x500bdf[_0x2564c5]['exports'];if(!_0x39488d)return![];if(!_0x5d6678["attributes"]&&_0x39488d['CompAttributes'])_0x5d6678['attributes']=_0x39488d;const _0x37dc19=_0x39488d['BattleAttributeKey']||_0x39488d['default']&&_0x39488d['default']['BattleAttributeKey'];if(!_0x5d6678['battleAttributeKey']&&_0x37dc19)_0x5d6678["battleAttributeKey"]=_0x37dc19;return!!(_0x5d6678['attributes']&&_0x5d6678['battleAttributeKey']);});}catch(_0x328eab){}return _0x5d6678;}function _0x66dbf5(_0x200393){var _0x2d3c00=_0x3b1178;try{const _0x5a792d=_0x200393&&(_0x200393["CompAttributes"]||_0x200393["default"]),_0x2783a5=_0x5a792d&&_0x5a792d["prototype"];if(!_0x2783a5||typeof _0x2783a5["get"]!=='function')return![];if(_0x22908a['has'](_0x2783a5))return!![];const _0x4b2cc2=_0x2783a5["get"],_0x3c67f1=function _0x48bc83(_0x2c917f){var _0x396131=_0x2d3c00;const _0x35da85=_0x4b2cc2['apply'](this,arguments);try{const _0x3b00a2=_0x30e996(_0x4cd848['get'](this)||this["entity"]||this["actor"]);if(_0x3b00a2)_0x4cd848["set"](this,_0x3b00a2);_0x55ba99(this,_0x2c917f,_0x35da85);}catch(_0x16f295){}return _0x35da85;};_0x3c67f1['__sdkBattleEnhanceObserved']=!![],_0x3c67f1["__sdkBattleEnhanceOriginal"]=_0x4b2cc2,_0x2783a5['get']=_0x3c67f1;if(typeof _0x2783a5["_change"]==='function'){const _0x571366=_0x2783a5['_change'],_0xe74434=function _0x32cde9(_0x310770){var _0xa407dd=_0x2d3c00;const _0x54499b=_0x571366["apply"](this,arguments);try{const _0x20b6da=_0x301313(),_0x34f7c5=_0x463b01||_0x20b6da["battleAttributeKey"]||{},_0x2d15c6=[_0x34f7c5['ATTACK_ABS'],_0x34f7c5["ATTACK"],_0x34f7c5['ATTACK_FIGHTING']],_0x2cbb66=_0x2d15c6['some'](function(_0x5ebd3e){return _0x5ebd3e!==undefined&&_0x5ebd3e!==null&&String(_0x5ebd3e)===String(_0x310770);});if(_0x2cbb66)_0x39d7e9(this);}catch(_0x4377ba){}return _0x54499b;};_0xe74434['__sdkBattleEnhanceObservedChange']=!![],_0xe74434['__sdkBattleEnhanceOriginal']=_0x571366,_0x2783a5["_change"]=_0xe74434;}Object['getOwnPropertyNames'](_0x2783a5)['forEach'](function(_0x5a59e3){var _0x5c7dd0=_0x2d3c00;try{if(_0x5a59e3==="get"||_0x5a59e3==="constructor")return;const _0x45ac4b=_0x2783a5[_0x5a59e3];if(typeof _0x45ac4b!=="function")return;const _0x344a9f=_0x5a59e3==="addAbsolute",_0x2d70c5=_0x5a59e3==="resetAddAbsolute",_0x2dd74e=_0x5a59e3==='resetBase',_0x53b485=_0x5a59e3==="addScale"||_0x5a59e3==="setAddScale";if(!_0x344a9f&&!_0x2d70c5&&!_0x2dd74e&&!_0x53b485)return;const _0xa9977=function _0x57030f(_0x36accd,_0x32b881){var _0x3d69e6=_0x5c7dd0;let _0x331463=![];try{_0x331463=!!(this['playback']&&this["playback"]["ignoreWriteEvent"]);}catch(_0xdaf345){}const _0x3a541e=_0x45ac4b["apply"](this,arguments);if(_0x331463){const _0x3778f1=_0x2dd74e?'resetBase':_0x2d70c5?'resetAddAbsolute':_0x344a9f?'addAbsolute':_0x53b485?"addScale":null;if(_0x3778f1)_0x2f1f12(this,_0x3778f1,_0x36accd,_0x32b881,![]);}return _0x3a541e;};_0xa9977["__sdkBattleEnhanceWriteObserved"]=!![],_0xa9977["__sdkBattleEnhanceOriginal"]=_0x45ac4b,_0x2783a5[_0x5a59e3]=_0xa9977;}catch(_0x3f5fd3){}});if(typeof _0x2783a5["cleanUp"]==="function"){const _0x5ecded=_0x2783a5['cleanUp'],_0x53d19f=function _0x38ba10(){var _0x1bbdcc=_0x2d3c00;const _0x4e9c23=_0x30e996(_0x4cd848["get"](this)||this['entity']||this['actor']),_0x25e6c0=_0x5ecded["apply"](this,arguments);try{const _0x2222ca=_0x356b4e(_0x4e9c23,this);_0x2222ca&&(_0x2222ca['attack']=NaN,_0x2222ca['shadow']=null,_0x2222ca['updatedAt']=Date["now"]());}catch(_0x3427c9){}return _0x25e6c0;};_0x53d19f['__sdkBattleEnhanceLiveAttackCleanUp']=!![],_0x53d19f['__sdkBattleEnhanceOriginal']=_0x5ecded,_0x2783a5['cleanUp']=_0x53d19f;}return _0x22908a["add"](_0x2783a5),!![];}catch(_0x5d893b){return![];}}function _0x30e996(_0x476e69){var _0x5172d5=_0x3b1178;try{if(!_0x476e69)return null;if(typeof _0x476e69["getComponent"]==='function'&&(_0x476e69['actor']||_0x476e69['ID']!==undefined||_0x476e69["scene"]))return _0x476e69;const _0x54521a=[_0x476e69["entity"],_0x476e69["skillUser"],_0x476e69["originalSkillUser"]];for(let _0x8147ab=0;_0x8147ab<_0x54521a["length"];_0x8147ab++){const _0x37df1f=_0x54521a[_0x8147ab];if(_0x37df1f&&_0x37df1f!==_0x476e69&&typeof _0x37df1f['getComponent']==='function'&&(_0x37df1f["actor"]||_0x37df1f['ID']!==undefined||_0x37df1f['scene']))return _0x37df1f;}for(let _0x54a736=0;_0x54a736<_0x194eff['length'];_0x54a736++){const _0x285830=_0x194eff[_0x54a736];if(!_0x285830)continue;if(_0x476e69===_0x285830||_0x476e69===_0x285830['actor']||_0x476e69===_0x285830["entity"])return _0x285830;if(_0x476e69['ID']!==undefined&&_0x285830['ID']!==undefined&&String(_0x476e69['ID'])===String(_0x285830['ID']))return _0x285830;}}catch(_0x2081c3){}return null;}function _0x311aab(_0x381f5a){var _0x29f184=_0x3b1178;if(!_0x48c649)return;if(_0x381f5a)_0x371267["add"](_0x381f5a);if(_0x37f103)return;_0x37f103=!![];const _0x109433=function(){var _0x4c58f4=_0x29f184;_0x37f103=![],_0x22389a=null;try{if(!_0x48c649){_0x371267['clear']();return;}_0x3c977a=Date['now']();const _0x56b133=Array['from'](_0x371267);_0x371267['clear'](),_0x5f0d99&&_0x56b133["forEach"](function(_0x2354bb){_0xce541b(_0x2354bb,_0x5f0d99);});}catch(_0x14feea){}},_0x4dadc1=Date['now']()-_0x3c977a,_0x3b46d3=Math['max'](0,_0x4e210b-_0x4dadc1);_0x22389a=setTimeout(_0x109433,_0x3b46d3);}function _0x381f53(_0x57833a,_0x55c445,_0x2a005f){var _0x4dcfea=_0x3b1178;try{const _0x2f71e0=_0x301313(),_0x5287b0=_0x55c445||_0x2f71e0["attributes"],_0x42318=_0x5af463(_0x57833a,_0x5287b0,null);if(_0x42318)_0x39d7e9(_0x42318);const _0x1083f8=_0x356b4e(_0x57833a,_0x42318);if(_0x1083f8&&Number["isFinite"](_0x1083f8['attack']))return Math['max'](0,_0x1083f8['attack']);const _0x22a367=_0x430433['get'](_0x57833a);if(_0x22a367!==undefined&&Number["isFinite"](_0x22a367))return Math["max"](0,_0x22a367);}catch(_0x50981f){}try{const _0x443fe9=_0x301313(),_0x47eb85=_0x55c445||_0x443fe9['attributes'],_0x180183=_0x2a005f||_0x443fe9['battleAttributeKey']||{},_0x2e3f3f=_0x5af463(_0x57833a,_0x47eb85,null),_0x492588=_0x1bfb27(_0x2e3f3f,_0x180183);if(_0x492588!==null&&Number["isFinite"](_0x492588)&&_0x492588>0)return _0x492588;}catch(_0x4147a7){}try{const _0xf14467=_0x57833a&&_0x57833a["actor"]&&_0x57833a["actor"]["data"]||{},_0x460598=[_0xf14467['attack'],_0xf14467["atk"],_0xf14467['ATK'],_0x57833a&&_0x57833a['actor']&&_0x57833a["actor"]["attack"]];for(let _0x3a839d=0;_0x3a839d<_0x460598['length'];_0x3a839d++){const _0x1e5ba6=_0x4d7c14(_0x460598[_0x3a839d]);if(_0x1e5ba6>0)return _0x1e5ba6;}}catch(_0x1a1a21){}return 0;}function _0xce541b(_0x4a6b19,_0x1442d2){var _0xa3a092=_0x3b1178;const _0x2569b8=_0x1442d2['headBoard']&&(_0x1442d2['headBoard']["CompHeadBoard"]||_0x1442d2['headBoard']['default']),_0x27e367=_0x1442d2['life']&&(_0x1442d2["life"]["CompLife"]||_0x1442d2['life']['default']),_0x708a1a=_0x1442d2["rage"]&&(_0x1442d2["rage"]['CompRage']||_0x1442d2["rage"]["default"]);if(!_0x2569b8||!_0x27e367||!_0x4a6b19||typeof _0x4a6b19['getComponent']!=='function')return;const _0x5c7da8=_0x4a6b19["getComponent"](_0x2569b8),_0x326680=_0x5c7da8&&_0x5c7da8['boardDisplay']&&_0x5c7da8['boardDisplay']['ui'];if(!_0x326680)return;const _0x50f2e0=_0x4334ec(_0x326680);if(!_0x50f2e0)return;if(!_0x48c649){_0x3ff7db(_0x50f2e0,![]);return;}const _0x318914=_0x4a6b19["getComponent"](_0x27e367);if(!_0x318914){_0x3ff7db(_0x50f2e0,![]);return;}const _0x1227c3=_0x708a1a?_0x4a6b19["getComponent"](_0x708a1a):null,_0x42517d=_0x326680['m_lifeBar'];if(!_0x42517d)return;const _0x5949b6=_0x4d7c14(_0x318914['current']),_0x289296=_0x4d7c14(_0x318914['max']),_0x2337fd=_0x1227c3?_0x4d7c14(_0x1227c3['current']):0,_0x3c06fe=100,_0x2df1f1=_0x170de7(_0x4a6b19,_0x1442d2['armorAssistant']),_0x57b946=_0x381f53(_0x4a6b19,_0x1442d2['attributes'],_0x1442d2['battleAttributeKey']),_0x41891f=Math['max'](1,Number(_0x42517d['width']||_0x42517d['_width']||0)),_0x462804=Math["max"](8,Number(_0x42517d['height']||_0x42517d["_height"]||0));let _0x32b7d7,_0x105b5e;if(_0x29ee7c){const _0x29c6a9=_0x27da1a();if(!_0x29c6a9||typeof _0x42517d['localToGlobal']!=='function'||typeof _0x29c6a9["globalToLocal"]!=="function"){_0x3ff7db(_0x50f2e0,![]);return;}const _0x2b53f4=_0x42517d["localToGlobal"](0,0),_0x162e2b=_0x29c6a9["globalToLocal"](_0x2b53f4['x'],_0x2b53f4['y']);_0x32b7d7=_0x162e2b['x']+_0x41891f/2,_0x105b5e=_0x162e2b['y'];}else{const _0x45f0a3=Number(_0x42517d['x']||0);_0x105b5e=Number(_0x42517d['y']||0),_0x32b7d7=_0x45f0a3+_0x41891f/2;}const _0x1eaa52=_0x5e8731["fgui"]['AlignType']?_0x5e8731["fgui"]['AlignType']['Center']:"center",_0x5d4bd3=Math['max'](168,_0x41891f*2.4),_0x5daf6a=Math['max'](88,_0x41891f*1.4),_0x3c8c03=Math['max'](220,_0x41891f*3.2);_0xf5bb8d(_0x50f2e0["stats"],'攻:'+_0x3fb940(_0x57b946,3)+" / 盾:"+_0x3fb940(_0x2df1f1,3),_0x32b7d7-_0x3c8c03/2,_0x105b5e-40,_0x3c8c03,18,_0x1eaa52),_0xf5bb8d(_0x50f2e0['hp'],'血:'+_0x3fb940(_0x5949b6,4,![])+'/'+_0x3fb940(_0x289296,4),_0x32b7d7-_0x5d4bd3/2,_0x105b5e-21,_0x5d4bd3,19,_0x1eaa52),_0xf5bb8d(_0x50f2e0['rage'],Math["round"](_0x2337fd)+'/'+Math['round'](_0x3c06fe),_0x32b7d7-_0x5daf6a/2,_0x105b5e+_0x462804+2,_0x5daf6a,18,_0x1eaa52),_0x3ff7db(_0x50f2e0,!![]);}function _0x352928(){var _0xb24446=_0x3b1178;const _0x5e4848=_0x5e8731['__require']||_0x5e8731['require'];if(typeof _0x5e4848!=="function")return![];try{const _0x8b4652=_0x5e4848("comp-head-board"),_0x3be65f=_0x5e4848("comp-life"),_0x262527=_0x5e4848("comp-rage"),_0x1149be=_0x5e4848("comp-armor-assistant"),_0x8ce4e6=_0xa51a44(_0x5e4848,['comp-attributes','../attribute/component/comp-attributes']),_0x5b99fa=_0xa51a44(_0x5e4848,["Configs","../../launcher/config/Configs",'../../../../launcher/config/Configs']),_0x48519d=_0xa51a44(_0x5e4848,['types-battle',"../../basis/types-battle",'../../../../basis/types-battle']),_0x4ef2e6=_0xa51a44(_0x5e4848,['battle-const','../../basis/data/battle-const','../../../../basis/data/battle-const']),_0x50a5e6=_0x5e4848('system-head-board'),_0xd87fb5=_0x50a5e6&&(_0x50a5e6["SystemHeadBoard"]||_0x50a5e6['default']),_0x34794d=_0xd87fb5&&_0xd87fb5['prototype'];if(!_0x34794d||typeof _0x34794d["_updateLifeAndRage"]!=="function")return![];const _0x59659d={'headBoard':_0x8b4652,'life':_0x3be65f,'rage':_0x262527,'armorAssistant':_0x1149be,'attributes':_0x8ce4e6,'battleAttributeKey':_0x5b99fa&&(_0x5b99fa['BattleAttributeKey']||_0x5b99fa["default"]&&_0x5b99fa['default']['BattleAttributeKey']||_0x5b99fa["Configs"]&&_0x5b99fa['Configs']['BattleAttributeKey'])||_0x48519d&&(_0x48519d["BattleAttributeKey"]||_0x48519d['default']&&_0x48519d["default"]['BattleAttributeKey'])||_0x4ef2e6&&(_0x4ef2e6['BattleAttributeKey']||_0x4ef2e6['default']&&_0x4ef2e6["default"]['BattleAttributeKey'])},_0x51c44a=_0x301313();if(!_0x59659d['attributes']&&_0x51c44a["attributes"])_0x59659d['attributes']=_0x51c44a["attributes"];if(!_0x59659d['battleAttributeKey']&&_0x51c44a['battleAttributeKey'])_0x59659d['battleAttributeKey']=_0x51c44a["battleAttributeKey"];if(_0x59659d["battleAttributeKey"])_0x463b01=_0x59659d['battleAttributeKey'];_0x5f0d99=_0x59659d,_0x66dbf5(_0x59659d["attributes"]);if(typeof _0x34794d['_updateLifeAndRage']==='function'&&!_0x34794d["_updateLifeAndRage"]["__sdkBattleEnhanceHooked"]){const _0x2c2e8e=_0x34794d["_updateLifeAndRage"],_0x422e13=function _0x9bd61e(_0x18422b){var _0x15dbd9=_0xb24446;const _0x4a386d=_0x2c2e8e["apply"](this,arguments);try{_0x311aab(_0x18422b);}catch(_0x2e2d34){}return _0x4a386d;};_0x422e13["__sdkBattleEnhanceHooked"]=!![],_0x422e13['__sdkBattleEnhanceOriginal']=_0x2c2e8e,_0x34794d['_updateLifeAndRage']=_0x422e13;}if(typeof _0x34794d['onFrame']==="function"&&!_0x34794d['onFrame']['__sdkBattleEnhanceHooked']){const _0x3439f=_0x34794d['onFrame'],_0x3b2c17=function _0x4b2866(){var _0xe3f881=_0xb24446;const _0x1fd64a=_0x3439f["apply"](this,arguments);try{const _0xed3abf=this["groups"]||[],_0x17115b=new Set();for(let _0xaf9ed2=0;_0xaf9ed2<_0xed3abf['length'];_0xaf9ed2++){const _0x34bae3=_0xed3abf[_0xaf9ed2]&&_0xed3abf[_0xaf9ed2]["entities"]||[];for(let _0x47dd59=0;_0x47dd59<_0x34bae3['length'];_0x47dd59++){const _0x5d61b3=_0x34bae3[_0x47dd59];if(_0x5d61b3)_0x17115b['add'](_0x5d61b3);}}const _0x58576b=Array['from'](_0x17115b);_0x194eff=_0x58576b['slice']?_0x58576b['slice']():_0x58576b,_0x58576b["forEach"](function(_0x48b1d6){var _0x58b44d=_0xe3f881;_0x371267["add"](_0x48b1d6);}),_0x311aab();}catch(_0x55b1a8){}return _0x1fd64a;};_0x3b2c17["__sdkBattleEnhanceHooked"]=!![],_0x3b2c17["__sdkBattleEnhanceOriginal"]=_0x3439f,_0x34794d['onFrame']=_0x3b2c17;}return!![];}catch(_0x4ee1ba){return![];}}function _0x3a6d0f(){if(!_0x48c649)return;_0x352928();if(_0x493383!==null)return;_0x493383=setInterval(function(){if(!_0x48c649){clearInterval(_0x493383),_0x493383=null;return;}_0x352928();},_0x44fa3d);}function _0x5e65c3(_0x3a0dbc){var _0x8975b8=_0x3b1178;_0x48c649=!!_0x3a0dbc;try{localStorage["setItem"](_0x14eade,_0x48c649?"true":'false');localStorage.setItem('__battle_numeric_display_enabled',_0x48c649?'1':'0');}catch(_0x8788ea){}if(_0x48c649)_0x3a6d0f();else _0x493383!==null&&(clearInterval(_0x493383),_0x493383=null);if(!_0x48c649){if(_0x22389a!==null)clearTimeout(_0x22389a);_0x22389a=null,_0x37f103=![],_0x371267['clear'](),_0x3c977a=0;}_0x5d65f9["forEach"](function(_0x155f8a){var _0x15e93e=_0x8975b8;try{if(!_0x155f8a||_0x155f8a["isDisposed"]){_0x5d65f9['delete'](_0x155f8a);return;}_0x3ff7db(_0x155f8a[_0x3e4c99],_0x48c649);}catch(_0x4221bf){}});}function _0x409f44(_0x55b839){var _0x33f42e=_0x3b1178;_0x29ee7c=!!_0x55b839;try{localStorage['setItem'](_0x3a5cce,_0x29ee7c?"true":'false');localStorage.setItem('__battle_numeric_display_top_layer',_0x29ee7c?'1':'0');}catch(_0x3e482c){}_0x5d65f9['forEach'](function(_0x439cfc){var _0x51f4f0=_0x33f42e;try{const _0x4b5f64=_0x439cfc&&_0x439cfc[_0x3e4c99],_0x3c1435=_0x5aa571(_0x439cfc);if(!_0x4b5f64||!_0x3c1435)return;Object["keys"](_0x4b5f64)["forEach"](function(_0x870331){_0x4c56b1(_0x4b5f64[_0x870331],_0x3c1435);});}catch(_0x3d1770){}}),_0x48c649&&_0x5f0d99&&(_0x194eff||[])['forEach'](function(_0x62d894){try{_0xce541b(_0x62d894,_0x5f0d99);}catch(_0x317673){}});}if(_0x48c649)_0x3a6d0f();


    function applyToggle(on) {
        _0x5e65c3(!!on);
    }

    function teardown() {
        try {
            applyToggle(false);
        } catch (_) {}
        try {
            if (_0x493383 !== null) {
                clearInterval(_0x493383);
                _0x493383 = null;
            }
        } catch (_) {}
        try {
            if (_0x22389a !== null) {
                clearTimeout(_0x22389a);
                _0x22389a = null;
            }
        } catch (_) {}
        unwrapSdkHooks();
        try {
            delete pageWindow.__GMM_STANDALONE_BATTLE_HUD__;
        } catch (_) {
            pageWindow.__GMM_STANDALONE_BATTLE_HUD__ = false;
        }
        try {
            delete pageWindow.__BATTLE_NUMERIC_DISPLAY__;
        } catch (_) {
            pageWindow.__BATTLE_NUMERIC_DISPLAY__ = false;
        }
    }

    pageWindow.__gmmBattleHud = {
        isEnabled: function () {
            return !!_0x48c649;
        },
        isTopLayer: function () {
            return !!_0x29ee7c;
        },
        setEnabled: applyToggle,
        enable: function () {
            applyToggle(true);
        },
        disable: function () {
            applyToggle(false);
        },
        setTopLayer: function (on) {
            _0x409f44(!!on);
        },
        refresh: function () {
            if (_0x48c649) _0x3a6d0f();
            if (_0x5f0d99 && _0x194eff && _0x194eff.length) {
                for (var i = 0; i < _0x194eff.length; i++) {
                    try {
                        _0xce541b(_0x194eff[i], _0x5f0d99);
                    } catch (e) {}
                }
            }
        },
    };

    pageWindow.__applyBattleNumericDisplay = applyToggle;
    pageWindow.__teardownBattleNumericDisplay = teardown;
    pageWindow.__battleNumericDisplayEnabled = !!_0x48c649;

    try {
        pageWindow.addEventListener('message', function (e) {
            if (!e || !e.data || e.data.type !== 'SET_BATTLE_NUMERIC_DISPLAY') return;
            applyToggle(!!e.data.enabled);
        });
    } catch (_) {}

    console.log(
        '[战斗实时数值] 系统脚本已启动 v1.3.0（CDN v1.0.9 提取；默认' +
            (_0x48c649 ? '开' : '关') +
            '，置顶' +
            (_0x29ee7c ? '开' : '关') +
            '）'
    );

    if (_0x48c649) {
        var _startCount = 0;
        var _startTimer = setInterval(function () {
            _startCount++;
            var r = pageWindow.__require || pageWindow.require;
            if (typeof r !== 'function') {
                if (_startCount > 120) { clearInterval(_startTimer); }
                return;
            }
            clearInterval(_startTimer);
            try {
                applyToggle(true);
            } catch (e) {}
        }, 500);
    }
})();

//# sourceURL=userscript-战斗实时数值.js
})();