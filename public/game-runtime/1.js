

// 全局一次性初始化,避免重复注入导致问题
if (!window.__hackInitDone) {
  window.__hackInitDone = true;
  
// 仅打补丁一次，避免重复包装导致堆栈过深
if (WebSocket && WebSocket.prototype && !WebSocket.prototype.send.__patched) {
  const _origSend = WebSocket.prototype.send;
  WebSocket.prototype.send = function(data) {
    try { _origSend.call(this, data); } finally {
      try { 
        if (typeof Android !== 'undefined') {
          Android.onWsSendData();
        } else if (window.electron && window.electron.ipcRenderer) {
          window.electron.ipcRenderer.send("wsSendData"); 
        }
      } catch (e) {}
    }
  };
  WebSocket.prototype.send.__patched = true;
}

  
// 仅初始化一次，避免重复包装导致深层调用栈
if (!window.__localStoragePatched) {
  window.__localStoragePatched = true;
  var recordItems = {};
  for (var key in recordItems) {
    try { localStorage.setItem(key, recordItems[key]); } catch (e) {}
  }
  var _origSetItem = localStorage.setItem.bind(localStorage);
  var _origRemoveItem = localStorage.removeItem.bind(localStorage);
  if (!localStorage.setItem.__patched) {
    localStorage.setItem = function (key, value) {
      _origSetItem(key, value);
      try {
        if (typeof Android !== 'undefined') {
          Android.setCacheItem(key, value);
        } else if (window.electron && window.electron.ipcRenderer) {
          window.electron.ipcRenderer.send("setItemEx", key, value);
        }
      } catch (e) {}
    };
    localStorage.setItem.__patched = true;
  }
  if (!localStorage.removeItem.__patched) {
    localStorage.removeItem = function (key) {
      _origRemoveItem(key);
      try {
        if (typeof Android !== 'undefined') {
          Android.removeCacheItem(key);
        } else if (window.electron && window.electron.ipcRenderer) {
          window.electron.ipcRenderer.send("removeItemEx", key);
        }
      } catch (e) {}
    };
    localStorage.removeItem.__patched = true;
  }
}


  
// 检测登录状态，如果已登录则隐藏重新登录按钮
var checkLoginStatus = function() {
  try {
    var reloginBtn = document.getElementById('relogin-button');
    if (reloginBtn && reloginBtn.style.display !== 'none') {
      var userData = localStorage.getItem('userData') || localStorage.getItem('token') || localStorage.getItem('userId');
      if (userData) {
        reloginBtn.style.display = 'none';
        var gameClosedText = document.querySelector('div[style*="游戏已经关闭了"]');
        if (gameClosedText) { gameClosedText.style.display = 'none'; }
        cc.director.resume();
      }
    }
  } catch (err) {}
};
// 仅设置一次定时器
if (!window.__loginStatusIntervalSet) {
  window.__loginStatusIntervalSet = true;
  setInterval(checkLoginStatus, 1000);
}

  if (!window.__hackMainIntervalSet) {
    window.__hackMainIntervalSet = true;
    setInterval(() => {
      try {


if (cc && !window.__multi && !cc.isAddAutoRender) {
  document.title = "摸鱼No.1";
  var oldRender = cc.renderer.render;
  var GlobalSignal = window.__require('GlobalSignal').GlobalSignal;
  GlobalSignal.EventUpdateAFKState.on(function (isEnter) {
    if (isEnter) {
      cc.renderer.customRenderCount = -30;
      cc.renderer.render = function (ecScene, dt) {
        cc.renderer.customRenderCount++;
        if (cc.renderer.customRenderCount < 0 || cc.renderer.customRenderCount % 300 == 0) {
          oldRender.call(this, ecScene, dt);
        }
      };
    } else {
      cc.renderer.render = oldRender;
    }
  });
  cc.isAddAutoRender = true;
}

        
var dataIndex = window.__require("data-index");
var LoginService = dataIndex.LoginService;
var oldAuthUser = LoginService.authUser;
if (oldAuthUser && !oldAuthUser.isSelfCreate) {
  LoginService.authUser = (oldData) => {
    return oldAuthUser(oldData);
  };
  LoginService.authUser.isSelfCreate = true;
}

var oldServerList = LoginService.serverList;
if (oldServerList && !oldServerList.isSelfCreate) {
  LoginService.serverList = (data) => {
    return oldServerList(data);
  };
  LoginService.serverList.isSelfCreate = true;
}
var oldIsolate = dataIndex.Isolate;
if (oldIsolate && !oldIsolate.isSelfCreate) {
  dataIndex.Isolate = function (data) {
    var iso = new oldIsolate(data);
    var isoAuthUser = iso.LoginService.authUser;
    iso.LoginService.authUser = (oldData) => {
      return isoAuthUser(oldData);
    };
    return iso;
  };
  dataIndex.Isolate.isSelfCreate = true;
}

        
var configs = window.__require('Configs');
if (configs.NightMare) {
  configs.NightMare.map.forEach((v) => (v.BattleSpeed = 100));
  console.log('[十殿加速] 十殿阎罗战斗速度已设为100倍');
}

        
// 帧率由管理页和 main.js 统一设置；getFrameRate 保持引擎原有的只读行为。

        
// 震动禁用
if (window.__require && !window.__require.vibrationPatched) {
  try {
    const MergePlayTilesContainer = window.__require('MergePlayTilesContainer').MergePlayTilesContainer;
    if (MergePlayTilesContainer && MergePlayTilesContainer.prototype && MergePlayTilesContainer.prototype.makeVibration) {
      MergePlayTilesContainer.prototype.makeVibration = function () {
        return false;
      };
      console.log('[震动禁用] 游戏震动已禁用');
    }
  } catch (e) {}
  window.__require.vibrationPatched = true;
}

        
// ========== 头像功能增强开始 ==========

// 1. 弹窗移除
if (!window.__avatarDialogObserver) {
  const BLOCK_TEXT = ['当前版本过低', '不支持更换头像', '请前往下载最新'];
  
  function removeAvatarBlockDialog(root) {
    const all = root.querySelectorAll ? root.querySelectorAll('*') : [];
    for (const el of all) {
      const t = (el.textContent || '').trim();
      if (!t) continue;
      if (BLOCK_TEXT.some(x => t.includes(x))) {
        let box = el;
        for (let i = 0; i < 6 && box && box.parentElement; i++) box = box.parentElement;
        if (box && box.remove) {
          box.remove();
          console.log('[头像解锁] 已移除版本提示弹窗');
        }
      }
    }
  }
  
  window.__avatarDialogObserver = new MutationObserver(mutations => {
    for (const m of mutations) {
      for (const n of m.addedNodes) {
        if (n.nodeType === 1) removeAvatarBlockDialog(n);
      }
    }
  });
  
  window.__avatarDialogObserver.observe(document.documentElement || document, { childList: true, subtree: true });
  console.log('[头像解锁] 弹窗监控已启动');
}

// 2. 平台环境伪造
if (!window.__avatarPlatformFaked) {
  const FAKE_VERSION = '99.99.99';
  const FAKE_APP_VERSION = '10.0.0';
  
  // 伪造 PlatformManager.instance
  try {
    var PlatformManager = window.__require("PlatformManager").PlatformManager;
    if (PlatformManager && PlatformManager.instance) {
      const pm = PlatformManager.instance;
      
      // 设置平台标识
      try { pm.isNative = true; } catch(e) {}
      try { pm.isAndroidAndNative = true; } catch(e) {}
      try { pm.isIos = false; } catch(e) {}
      try { pm.isByteDance = true; } catch(e) {}
      try { pm.isWeChat = false; } catch(e) {}
      try { pm.isQQ = false; } catch(e) {}
      try { pm.isH5 = false; } catch(e) {}
      
      // 伪造 getClientVersion
      if (pm.getClientVersion && !pm.getClientVersion.__faked) {
        const origGetClientVersion = pm.getClientVersion;
        pm.getClientVersion = function(cb) {
          if (typeof cb === 'function') {
            try { cb(FAKE_VERSION); } catch(e) {}
            return;
          }
          if (origGetClientVersion) {
            const result = origGetClientVersion.apply(this, arguments);
            if (result && result.then) return Promise.resolve(FAKE_VERSION);
          }
          return Promise.resolve(FAKE_VERSION);
        };
        pm.getClientVersion.__faked = true;
      }
      
      // 伪造 getVersion
      if (pm.getVersion && !pm.getVersion.__faked) {
        const origGetVersion = pm.getVersion;
        pm.getVersion = function(cb) {
          if (typeof cb === 'function') {
            try { cb(FAKE_VERSION); } catch(e) {}
            return;
          }
          if (origGetVersion) {
            const result = origGetVersion.apply(this, arguments);
            if (result && result.then) return Promise.resolve(FAKE_VERSION);
          }
          return Promise.resolve(FAKE_VERSION);
        };
        pm.getVersion.__faked = true;
      }
      
      // 伪造 getAppVersion
      if (pm.getAppVersion && !pm.getAppVersion.__faked) {
        const origGetAppVersion = pm.getAppVersion;
        pm.getAppVersion = function(cb) {
          if (typeof cb === 'function') {
            try { cb(FAKE_APP_VERSION); } catch(e) {}
            return;
          }
          if (origGetAppVersion) {
            const result = origGetAppVersion.apply(this, arguments);
            if (result && result.then) return Promise.resolve(FAKE_APP_VERSION);
          }
          return Promise.resolve(FAKE_APP_VERSION);
        };
        pm.getAppVersion.__faked = true;
      }
      
      console.log('[头像解锁] 平台环境已伪造为抖音客户端 v' + FAKE_VERSION);
    }
  } catch(e) {
    console.log('[头像解锁] PlatformManager伪造失败:', e.message);
  }
  
  window.__avatarPlatformFaked = true;
}

// 3. 自定义头像选择
if (window.HORTOR_AGENT && !window.HORTOR_AGENT._chooseImagePatched) {
  const originalChooseImage = window.HORTOR_AGENT.chooseImage;
  window.HORTOR_AGENT.chooseImage = function (callback, options) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.onchange = (e) => {
      const file = e.target.files[0];
      document.body.removeChild(input);
      if (!file) return;

      const img = new Image();
      img.onload = () => {
        // 创建小图 98x98
        const smallCanvas = document.createElement('canvas');
        smallCanvas.width = 98;
        smallCanvas.height = 98;
        smallCanvas.getContext('2d').drawImage(img, 0, 0, 98, 98);
        const smallBase64 = smallCanvas.toDataURL('image/jpeg', 1).split(',')[1];

        // 创建大图 512x512
        const largeCanvas = document.createElement('canvas');
        largeCanvas.width = 512;
        largeCanvas.height = 512;
        largeCanvas.getContext('2d').drawImage(img, 0, 0, 512, 512);
        const largeBase64 = largeCanvas.toDataURL('image/jpeg', 1).split(',')[1];

        callback({ base64s: [largeBase64, smallBase64], images: [], imagePath: '' });
      };
      img.src = URL.createObjectURL(file);
    };
    input.click();
  };
  window.HORTOR_AGENT._chooseImagePatched = true;
  console.log('[头像解锁] 自定义头像选择功能已启用');
}

// ========== 头像功能增强结束 ==========


        
var PlatformManager = window.__require("PlatformManager").PlatformManager;
var oldSetClipboardData = PlatformManager.instance.setClipboardData;
if (!oldSetClipboardData.isSelfCreate) {
  PlatformManager.instance.setClipboardData = function (data) {
    const textToCopy = data.data;

    // 1. Android 环境
    if (typeof Android !== 'undefined') {
      try {
        Android.setClipboardData(textToCopy);
        data.success && data.success();
        return;
      } catch (e) {}
    }

    // 2. Electron 环境
    if (window.electron && window.electron.ipcRenderer) {
      try {
        window.electron.ipcRenderer.send("setClipboardData", textToCopy);
        data.success && data.success();
        return;
      } catch (e) {}
    }

    // 3. 现代浏览器环境 (包括手机浏览器)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          data.success && data.success();
        })
        .catch(() => {
          fallbackCopyTextToClipboard(textToCopy, data);
        });
      return;
    }

    // 4. 传统方法降级
    fallbackCopyTextToClipboard(textToCopy, data);
  };

  // 传统复制方法
  function fallbackCopyTextToClipboard(text, data) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    textArea.style.width = "2em";
    textArea.style.height = "2em";
    textArea.style.padding = "0";
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";
    textArea.style.background = "transparent";
    textArea.style.fontSize = "16px";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, textArea.value.length);

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        data.success && data.success();
      } else {
        data.fail && data.fail();
      }
    } catch (err) {
      data.fail && data.fail();
    }

    document.body.removeChild(textArea);
  }

  PlatformManager.instance.setClipboardData.isSelfCreate = true;
}

        
var PlatformManager = window.__require("PlatformManager").PlatformManager;
var oldExitGame = PlatformManager.instance.exitGame;
if (!oldExitGame.isSelfCreate) {
  PlatformManager.instance.exitGame = function () {
    if (typeof Android !== 'undefined') {
      Android.reloginGame();
    } else if (window.electron && window.electron.ipcRenderer) {
      window.electron.ipcRenderer.send("relogin-game");
    } else {
      try {
        var lmMod = window.__require('LoginManager');
        var lmInst = lmMod && (lmMod.LoginManager && lmMod.LoginManager.instance || lmMod.default && lmMod.default.instance);
        if (lmInst && typeof lmInst.reLogin === 'function') {
          var retryCount = 0;
          var tryReLogin = function() {
            lmInst.reLogin().catch(function() {
              if (retryCount < 5) { retryCount++; setTimeout(tryReLogin, 3000); }
            });
          };
          tryReLogin();
        }
      } catch(e) {}
    }
  };
  PlatformManager.instance.exitGame.isSelfCreate = true;
}

        
var TeamRenameDialog = window.__require("TeamRenameDialog").TeamRenameDialog;
var oldTeamNameOnChanged = TeamRenameDialog.prototype.onChanged;
if (!oldTeamNameOnChanged.isSelfCreate) {
  TeamRenameDialog.prototype.onChanged = function () {
    this.ui.m_cdkInput.text = this.ui.m_cdkInput.text.slice(0, 10);
  };
  var oldTeamNameOnConfirmClick = TeamRenameDialog.prototype._onConfirmClick;
  TeamRenameDialog.prototype._onConfirmClick = async function () {
    if (this.targetId >= 1000) {
      const teamName = this.ui.m_cdkInput.text;
      if (teamName.length == 0) {
        return;
      }
      try {
        this.closeFun(teamName, this.targetId);
      } finally {
        this.close();
      }
    } else {
      oldTeamNameOnConfirmClick.call(this);
    }
  };
  TeamRenameDialog.prototype.onChanged.isSelfCreate = true;
}

        
// 拦截 GameLoginState._checkShowPrivacy
if (window.__require && !window.__require.userAgreementPatched) {
  try {
    const gameLoginModule = window.__require('game-login');
    const GameLoginState = gameLoginModule && gameLoginModule.GameLoginState;
    if (GameLoginState && GameLoginState.prototype && GameLoginState.prototype._checkShowPrivacy && !GameLoginState.prototype._checkShowPrivacy.isPatched) {
      GameLoginState.prototype._checkShowPrivacy = function() {
        console.log('[agreement-patch] 已拦截隐私协议检查');
        return Promise.resolve();
      };
      GameLoginState.prototype._checkShowPrivacy.isPatched = true;
      console.log('[agreement-patch] 成功拦截 GameLoginState._checkShowPrivacy');
    }
  } catch (e) {}
}

        
// 拦截 ShareManager.shareMessage
if (window.__require && !window.__require.shareMessagePatched) {
  try {
    const dataIndex = window.__require("data-index");
    const ShareManager = window.__require("ShareManager").ShareManager;
    const ShareType = window.__require("types-common").ShareType;
    const EMShareType = dataIndex.EMShareType;

    if (ShareManager && ShareManager.prototype && ShareManager.prototype.shareMessage && !ShareManager.prototype.shareMessage.isSelfCreate) {
      ShareManager.prototype.shareMessage = function(sharkType, r) {
        let emShareType = 0;
        switch (sharkType) {
          case ShareType.AutoClick:
            emShareType = EMShareType.autoClick;
            break;
          case ShareType.HangUp:
            emShareType = EMShareType.hangUp;
            break;
          case ShareType.Task:
            emShareType = EMShareType.task;
            break;
          case ShareType.EvoTowerMerge:
            emShareType = EMShareType.mergeBox;
            break;
          case ShareType.EvoTower:
            emShareType = EMShareType.evoTower;
            break;
        }
        return dataIndex.SystemService.myShareCallback({
          type: emShareType,
          isSkipShareCard: true
        });
      };
      ShareManager.prototype.shareMessage.isSelfCreate = true;
      console.log('[share-patch] 成功拦截 ShareManager.shareMessage');
    }
  } catch (e) {}
}

        

        
// ConsoleManager提示增强 - 在定时器中尝试加载
if (window.__require && !window.__require.consoleTipPatched) {
  try {
    const ConsoleManager = window.__require('ConsoleManager').ConsoleManager;
    const oldShowTip = ConsoleManager.prototype.showTip;
    if (!oldShowTip.isSelfCreate) {
      ConsoleManager.prototype.showTip = function (e) {
        oldShowTip.call(this, e);
        // 不再覆盖原有的版本显示
        // this._textInst.setTip('v1.2.2|' + this._textInst._text)
      };
      ConsoleManager.prototype.showTip.isSelfCreate = true;
      console.log('[console-tip-patch] ConsoleManager提示增强已加载');
    }
    window.__require.consoleTipPatched = true;
  } catch (e) {}
}

        
// PlatformManager.shareMessage补丁 - 在定时器中尝试加载
if (window.__require && !window.__require.platformSharePatched) {
  try {
    const PlatformManager = window.__require('PlatformManager').PlatformManager;
    const oldPMShareMessage = PlatformManager.prototype.shareMessage;
    if (!oldPMShareMessage.isSelfCreate) {
      PlatformManager.prototype.shareMessage = async function () {
        return true;
      };
      PlatformManager.prototype.shareMessage.isSelfCreate = true;
      console.log('[platform-share-patch] PlatformManager.shareMessage补丁已加载');
    }
    window.__require.platformSharePatched = true;
  } catch (e) {}
}

        
// 战斗模拟功能 - 在定时器中尝试加载
if (window.__require) {
  try {
    const ccRequire = window.__require;
    if (!window.__require.battleSimPatched) {
      // 辅助函数
      function getChineseName(name) {
        const configs = window.__require('Configs');
        const languageName = configs.LanguageConf.getByKey(name);
        if (languageName) {
          return languageName.chinese;
        }
        return name;
      }
      function getItemName(itemId) {
        const configs = window.__require('Configs');
        const itemConf = configs.ItemConf.getById(itemId);
        if (!itemConf || !itemConf.name) {
          return '未知道具(' + itemId + ')';
        }
        return getChineseName(itemConf.name);
      }
      function getSkillName(skillId) {
        const configs = window.__require('Configs');
        const skillConf = configs.SkillSchemeConf.getById(skillId);
        if (!skillConf) {
          return skillId;
        }
        return skillConf.skillName;
      }
      function getHeroName(heroId) {
        return getItemName(heroId).replace('碎片', '');
      }

      function getBattleVersion() {
        try {
          const managerFactory = window.__require('manager-factory');
          const levelBattle = managerFactory.GET_LEVEL_BATTLE();
          if (levelBattle && levelBattle.options && levelBattle.options.battleData) {
            return levelBattle.options.battleData.version || 1;
          }
        } catch (e) {
          console.warn('获取战斗版本失败，使用默认值:', e);
        }
        return 1;
      }

      function getLeftBattleTeam(addAttributeBonus, addAttributes = []) {
        const managerFactory = window.__require('manager-factory');
        const levelBattle = managerFactory.GET_LEVEL_BATTLE();
        const configs = window.__require('Configs');
        const dataIndex = window.__require('data-index');
        const GET_MODULE = window.__require('ModuleManager').GET_MODULE;

        // 检查是否有有效的战斗数据
        if (!levelBattle || !levelBattle.options || !levelBattle.options.battleData || !levelBattle.options.battleData.leftTeam) {
          console.warn('无法获取当前战斗队伍数据，使用玩家当前队伍');
          // 使用玩家当前的队伍数据
          const leftTeam = new dataIndex.BattleTeam();
          leftTeam.avatarFrame = ROLE.avatarFrame;
          leftTeam.headImg = ROLE.headImg;
          leftTeam.name = ROLE.name;
          leftTeam.roleId = ROLE.roleId;
          leftTeam.power = ROLE.power;
          leftTeam.weaponId = ROLE.lordWeaponId;
          leftTeam.options = new Map();
          leftTeam.attributeBonus = new Map();
          leftTeam.customCard = new Map();
          leftTeam.legionName = ROLE.legionName || '';
          leftTeam.levelWeaponSkillId = [];
          leftTeam.lordAttackTime = [];
          leftTeam.lordAutoAttackTime = [];
          leftTeam.lordSkill = [];
          leftTeam.lordSkinId = 0;
          leftTeam.tapAttack = ROLE.tapAttack || 0;
          leftTeam.weaponActiveLevelId = 0;
          leftTeam.teamInfo = [];
          if (ROLE.legacy && ROLE.legacy.scheduleId >= SERVER_DATA.roleLegacy.scheduleId) {
            leftTeam.legacyColor = ROLE.legacy.color;
          }

          const equipmentModule = GET_MODULE(configs.ModuleType.EQUIP);
          equipmentModule.equipEnchantData.rebuildEnchantSourceList();

          // 从玩家的 battleTeam 中获取队伍数据
          ROLE.battleTeam.forEach((value, key) => {
            const hero = ROLE.heroes.get(value.heroId);
            if (!hero) return;

            const fighter = new dataIndex.Fighter();
            fighter.id = hero.heroId;
            fighter.type = 0;
            fighter.index = key;
            fighter.curEnergy = 0;
            fighter.skin = hero.useSkin || 0;
            fighter.skinName = '';
            fighter.activeSkill = 0;

            for (const skill of hero.skill) {
              if (skill.active) {
                fighter.skill.push(skill.skillId);
              }
            }
            for (const skill of hero.appendSkill) {
              if (skill.active) {
                fighter.skill.push(skill.skillId);
              }
            }

            fighter.attack = hero.attack;
            fighter.color = hero.color;
            fighter.curHp = hero.hp;
            fighter.defense = hero.defense;
            fighter.hp = hero.hp;
            fighter.level = hero.level;
            fighter.order = hero.order;
            fighter.recordFlag = hero.recordFlag;
            fighter.speed = hero.speed;
            fighter.star = hero.star;
            fighter.attribute = new Map(hero.attribute);
            fighter.enchantMap = new Map();

            leftTeam.team.set(key, fighter);
          });

          return leftTeam;
        }

        const levelBattleData = levelBattle.options.battleData;
        const equipmentModule = GET_MODULE(configs.ModuleType.EQUIP);
        equipmentModule.equipEnchantData.rebuildEnchantSourceList();
        const leftTeam = new dataIndex.BattleTeam();
        if (addAttributeBonus) {
          leftTeam.attributeBonus = levelBattleData.leftTeam.attributeBonus;
        }
        leftTeam.avatarFrame = levelBattleData.leftTeam.avatarFrame;
        leftTeam.customCard = levelBattleData.leftTeam.customCard;
        leftTeam.headImg = ROLE.headImg;
        leftTeam.legionName = levelBattleData.leftTeam.legionName;
        leftTeam.levelWeaponSkillId = levelBattleData.leftTeam.levelWeaponSkillId;
        leftTeam.lordAttackTime = levelBattleData.leftTeam.lordAttackTime;
        leftTeam.lordAutoAttackTime = levelBattleData.leftTeam.lordAutoAttackTime;
        leftTeam.lordSkill = levelBattleData.leftTeam.lordSkill;
        leftTeam.lordSkinId = levelBattleData.leftTeam.lordSkinId;
        leftTeam.name = ROLE.name;
        leftTeam.options = levelBattleData.leftTeam.options;
        leftTeam.power = levelBattleData.leftTeam.power;
        leftTeam.roleId = levelBattleData.leftTeam.roleId;
        leftTeam.tapAttack = levelBattleData.leftTeam.tapAttack;
        leftTeam.weaponActiveLevelId = levelBattleData.leftTeam.weaponActiveLevelId;
        leftTeam.weaponId = levelBattleData.leftTeam.weaponId;
        leftTeam.teamInfo = levelBattleData.leftTeam.teamInfo;
        // 同步当前出战的宠物（petUId 空串=未装备）
        const _petUId = (levelBattleData.leftTeam && levelBattleData.leftTeam.petUId)
          || (ROLE.petData && ROLE.petData.petUId)
          || (ROLE.pet && ROLE.pet.petUId) || '';
        leftTeam.petUId = _petUId;
        if (_petUId) {
          if (ROLE.pet && (ROLE.pet.petId || ROLE.pet.petUId)) {
            leftTeam.pet = Object.assign({}, ROLE.pet);
          } else if (levelBattleData.leftTeam && levelBattleData.leftTeam.pet) {
            leftTeam.pet = levelBattleData.leftTeam.pet;
          }
          if (leftTeam.pet && SERVER_DATA && SERVER_DATA.rolePet) {
            try {
              const _full = SERVER_DATA.rolePet.getPet(_petUId);
              if (_full) {
                const _combatKeys = ['level', 'exp', 'starId', 'talentId', 'petActiveSkillId',
                  'petPassiveSkillIds', 'passiveSkillIds', 'skillLevel', 'petSkillLevel',
                  'awaken', 'evolution', 'petEvo', 'power'];
                for (let _k = 0; _k < _combatKeys.length; _k++) {
                  const _key = _combatKeys[_k];
                  if (leftTeam.pet[_key] == null && _full[_key] != null) {
                    leftTeam.pet[_key] = _full[_key];
                  }
                }
              }
            } catch (e) { }
          }
        }
        if (leftTeam.pet) {
          leftTeam.petId = leftTeam.pet.petId != null ? leftTeam.pet.petId : leftTeam.petId;
          leftTeam.petActiveSkillId = leftTeam.pet.petActiveSkillId != null ? leftTeam.pet.petActiveSkillId : leftTeam.petActiveSkillId;
          leftTeam.petEvo = leftTeam.pet.petEvo != null ? leftTeam.pet.petEvo : leftTeam.petEvo;
        }
        if (ROLE.legacy && ROLE.legacy.scheduleId >= SERVER_DATA.roleLegacy.scheduleId) {
          leftTeam.legacyColor = ROLE.legacy.color;
        }

        const totalAddAttributes = [...addAttributes];

        // 阵营加成
        let maxClubCnt = 0;
        const clubInfo = {};
        levelBattleData.leftTeam.team.forEach((value, key) => {
          const heroConf = configs.HeroConf.getById(value.id);
          if (heroConf.color != 3) {
            return;
          }
          if (clubInfo[heroConf.club]) {
            clubInfo[heroConf.club]++;
          } else {
            clubInfo[heroConf.club] = 1;
          }
          if (clubInfo[heroConf.club] > maxClubCnt) {
            maxClubCnt = clubInfo[heroConf.club];
          }
        });
        if (maxClubCnt == 3) {
          totalAddAttributes.push(
            { type: 7, value: 0.1 },
            { type: 5, value: 0.1 }
          );
        }
        if (maxClubCnt == 4) {
          totalAddAttributes.push(
            { type: 7, value: 0.15 },
            { type: 5, value: 0.15 }
          );
        }
        if (maxClubCnt == 5) {
          totalAddAttributes.push(
            { type: 7, value: 0.18 },
            { type: 5, value: 0.18 }
          );
        }

        // 徽章加成
        for (const medallionId of ROLE.medallion) {
          const medallionInfo = ROLE.medallionStorage.get(medallionId);
          if (Date.now() / 1000 > medallionInfo.expire) {
            continue;
          }
          const medallionConfig = configs.MedallionConf.getById(medallionId);
          totalAddAttributes.push(...medallionConfig.attrs);
        }

        levelBattleData.leftTeam.team.forEach((value, key) => {
          const hero = ROLE.heroes.get(value.id);
          const fighter = new dataIndex.Fighter();
          fighter.id = value.id;
          fighter.type = value.type;
          fighter.index = value.index;
          fighter.curEnergy = value.curEnergy;
          fighter.skin = value.skin;
          fighter.skinName = value.skinName;
          fighter.activeSkill = value.activeSkill;
          for (const skill of hero.skill) {
            if (skill.active) {
              fighter.skill.push(skill.skillId);
            }
          }
          for (const skill of hero.appendSkill) {
            if (skill.active) {
              fighter.skill.push(skill.skillId);
            }
          }
          fighter.attack = hero.attack;
          fighter.color = hero.color;
          fighter.curHp = hero.hp;
          fighter.defense = hero.defense;
          fighter.hp = hero.hp;
          fighter.level = hero.level;
          fighter.order = hero.order;
          fighter.recordFlag = hero.recordFlag;
          fighter.speed = hero.speed;
          fighter.star = hero.star;
          const attribute = new Map([...hero.attribute]);

          // 额外加成
          for (const attr of totalAddAttributes) {
            if (attribute.has(attr.type)) {
              attribute.set(attr.type, attribute.get(attr.type) + attr.value);
            } else {
              attribute.set(attr.type, attr.value);
            }
          }
          // 赐福加成
          fighter.enchantMap = new Map();
          ROLE.enchantMap.forEach((toEnchantUId, fromEnchantUId) => {
            const target = equipmentModule.equipEnchantData.getSourceByUid(toEnchantUId);
            if (fighter.id != target.heroId) {
              return;
            }
            const source = equipmentModule.equipEnchantData.getSourceByUid(fromEnchantUId);

            if (Math.random() < 0.2 * source.redQuenchCount) {
              // 触发了
              const sourceHero = ROLE.heroes.get(source.heroId);
              const equip = sourceHero.equipment.get(source.equipIndex + 1);
              const quenches = source.quenchId == 0 ? equip.quenches : equip.quenches2;
              const canRandomQuenches = [];
              for (const [_, quenche] of quenches) {
                if (quenche.colorId != 6) {
                  continue;
                }
                // 已经赐福的属性不能再赐福
                const attrConf = configs.QuenchAttrConf.getById(quenche.attrId);
                if (fighter.enchantMap.has(attrConf.attr)) {
                  continue;
                }
                canRandomQuenches.push(quenche);
              }
              if (canRandomQuenches.length > 0) {
                // 触发了
                const idx = Math.floor(canRandomQuenches.length * Math.random());
                const quenche = canRandomQuenches[idx];
                const attrConf = configs.QuenchAttrConf.getById(quenche.attrId);
                const attrValue = quenche.attrNum * attrConf.maxValue * attrConf.changeRatio / 100;

                // 增加属性
                if (attribute.has(attrConf.attr)) {
                  attribute.set(attrConf.attr, attribute.get(attrConf.attr) + attrValue);
                } else {
                  attribute.set(attrConf.attr, attrValue);
                }
                // 记录一下 其他部位不能再加这个属性了
                fighter.enchantMap.set(attrConf.attr, 1);
                console.warn(source.heroName, '赐福给', target.heroName, attrConf.attr, attrValue);
              }
            }
          });

          for (const key of attribute.keys()) {
            const newValue = Math.round(attribute.get(key) * 100000) / 100000;
            attribute.set(key, newValue);
          }
          fighter.attribute = attribute;

          leftTeam.team.set(key, fighter);
        });
        return leftTeam;
      }

      function showBattleUI(
        battleMode,
        randomSeed,
        inputOptions,
        battleOptions,
        mapId,
        stageNameStr,
        rightMonsters,
        rightColor,
        showRightLevel,
        showRightPower,
        addAttributeBonus,
        addAttributes,
        maxRound = 0,
        onBattleEnd,
        onResultEnd
      ) {
        return new Promise((resolve) => {
          const BattleUIManager = window.__require('BattleUIManager');
          const Configs = window.__require('Configs');
          const dataIndex = window.__require('data-index');
          const topName = `随机种子:${randomSeed}`;
          const rightTeam = new dataIndex.BattleTeam();
          rightTeam.legacyColor = rightColor || 0;
          let rightPower = 0;
          for (const [id, index, level] of rightMonsters) {
            const monsterConfig = Configs.MonsterConf.getById(id);
            const fighter = new dataIndex.Fighter();
            fighter.type = 1;
            fighter.activeSkill = 0;
            fighter.attack = 0;
            fighter.color = 0;
            fighter.curEnergy = 0;
            fighter.curHp = 0;
            fighter.defense = 0;
            fighter.hp = 0;
            fighter.id = id;
            fighter.index = index;
            fighter.level = level;
            fighter.order = 0;
            fighter.recordFlag = false;
            fighter.skill = [];
            fighter.skin = monsterConfig ? monsterConfig.skinId : 0;
            fighter.skinName = '';
            fighter.speed = 0;
            fighter.star = 0;
            rightTeam.team.set(index, fighter);
            rightPower += monsterConfig.power;
          }
          const battleData = new dataIndex.BattleData();
          battleData.id = Date.now();
          battleData.randomSeed = randomSeed;
          battleData.mode = battleMode;
          battleData.options = battleOptions;
          battleData.version = getBattleVersion();
          battleData.leftTeam = getLeftBattleTeam(addAttributeBonus, addAttributes);
          battleData.rightTeam = rightTeam;
          battleData.maxRound = maxRound;

          const battleInputData = {
            battleData: battleData,
            mapId: mapId,
            options: inputOptions,
            stageNameStr: stageNameStr,
            startTipTopName: topName,
            startTipStage: stageNameStr,
            topName: topName,
            showRightLevel: showRightLevel,
            showRightPower: showRightPower,
            battleEnd: async (battleInputData, battleResult, proxy) => {
              const battleResultData = battleInputData.battleResult || battleResult;
              resolve(battleResultData);
              onBattleEnd && onBattleEnd(battleResultData);
              await BattleUIManager.SHOW_BATTLE_RESULT({
                battleInputData: battleInputData,
                battleResultData: battleResultData
              });
              onResultEnd && onResultEnd();
              const managerFactory = window.__require('manager-factory');
              managerFactory.QUIT_BATTLE(battleInputData);
              proxy.close();
            }
          };
          BattleUIManager.SHOW_BATTLE_UI(battleInputData);
        });
      }

      function tryBattle(battleData, extendConfig = {}, timeScale = 100) {
        const ServerBattleLauncher = window.__require('launcher-server').ServerBattleLauncher;
        const battleLauncher = new ServerBattleLauncher();
        battleLauncher.initialize();
        const battleConfig = Object.assign({ noRender: true }, extendConfig);
        const battle = battleLauncher.createBattleById({
          battleData: battleData,
          timeScale: timeScale,
          extend: battleConfig
        });
        let currentTime = Date.now();
        let battleResult = null;
        battle.BattleResult.add((result) => {
          battleResult = result;
          battle.endBattle();
        });
        battle.startBattle();
        let iterationCount = 0;
        while (!battle.isQuitted) {
          battle.update(currentTime);
          currentTime += 20;

          if (iterationCount++ >= 30 * 60 * 50) {
            throw new Error('战斗时间过长!');
          }
        }
        return battleResult;
      }

      async function checkBattleProbility(
        battleName,
        env,
        battleMode,
        battleOptions,
        rightMonsters,
        rightColor,
        addAttributeBonus,
        addAttributes = [],
        maxRound = 0,
        onBattleEnd
      ) {
        const TipsManager = window.__require('TipsManager');
        const Configs = window.__require('Configs');
        const dataIndex = window.__require('data-index');
        const rightTeam = new dataIndex.BattleTeam();
        rightTeam.legacyColor = rightColor || 0;
        for (const [id, index, level] of rightMonsters) {
          const monsterConfig = Configs.MonsterConf.getById(id);
          const fighter = new dataIndex.Fighter();
          fighter.type = 1;
          fighter.activeSkill = 0;
          fighter.attack = 0;
          fighter.color = 0;
          fighter.curEnergy = 0;
          fighter.curHp = 0;
          fighter.defense = 0;
          fighter.hp = 0;
          fighter.id = id;
          fighter.index = index;
          fighter.level = level;
          fighter.order = 0;
          fighter.recordFlag = false;
          fighter.skill = [];
          fighter.skin = monsterConfig ? monsterConfig.skinId : 0;
          fighter.skinName = '';
          fighter.speed = 0;
          fighter.star = 0;
          rightTeam.team.set(index, fighter);
        }
        const battleData = new dataIndex.BattleData();
        battleData.mode = battleMode;
        battleData.options = battleOptions;
        battleData.version = getBattleVersion();
        battleData.leftTeam = getLeftBattleTeam(addAttributeBonus, addAttributes);
        battleData.rightTeam = rightTeam;
        battleData.maxRound = maxRound;

        let winCount = 0;
        let loseCount = 0;
        let winRoundSum = 0;
        function showBattleProbility() {
          let probility = 0;
          const totalCount = winCount + loseCount;
          probility = (100 * winCount) / totalCount;
          const avgRound = winCount > 0 ? (winRoundSum / winCount).toFixed(2) : 0;
          TipsManager.SHOW_TIP(
            `${battleName} 胜: ${winCount} 负: ${loseCount} 概率: ${probility.toFixed(2)}% 平均回合: ${avgRound}`
          );
        }
        for (let randomSeed = 1; randomSeed <= 9999; randomSeed++) {
          if (env.isStop) {
            return;
          }
          battleData.randomSeed = randomSeed;
          const battleResult = tryBattle(battleData);
          if (onBattleEnd) {
            onBattleEnd(battleResult, env);
          } else {
            if (battleResult.isWin) {
              winCount++;
              winRoundSum += battleResult.round;
            } else {
              loseCount++;
            }
            const totalCount = winCount + loseCount;
            if (totalCount % 10 == 0) {
              showBattleProbility();
            }
          }
          await new Promise((f) => setTimeout(f, 0));
        }

        while (!env.isStop) {
          if (onBattleEnd) {
            onBattleEnd(null, env);
          } else {
            showBattleProbility();
          }
          await new Promise((f) => setTimeout(f, 2000));
        }
      }

      // 十殿阎罗模拟
      try {
        const UI_NightmarePanel = ccRequire('UI_NightmarePanel').default;
        const oldNightmarePanelOnConstruct = UI_NightmarePanel.prototype.onConstruct;
        if (!oldNightmarePanelOnConstruct.isSelfCreate) {
          UI_NightmarePanel.prototype.onConstruct = function () {
            oldNightmarePanelOnConstruct.call(this);
            const btnTeamPos = this.m_btnTeam.node.getPosition();
            const UI_BtnSmall = ccRequire('UI_BtnSmall').default;
            
            const simulateBattle = (bossId, stage) => {
              try {
                console.log('[十殿模拟] ===== 开始 =====');
                console.log('[十殿模拟] bossId:', bossId, 'stage:', stage);
                
                const randomSeed = window.TestSeed || Math.floor(Math.random() * 9999) + 1;
                const mapId = 100000 + bossId;
                let stageNameStr = `模拟十殿${bossId}`;
                let monsterBoosId = bossId;
                
                if (bossId == 9 && stage) {
                  if (stage === 2) {
                    stageNameStr = `模拟十殿9 二阶段`;
                    monsterBoosId = 12;
                    console.log('[十殿模拟] 使用二阶段');
                  } else {
                    stageNameStr = `模拟十殿9 一阶段`;
                    monsterBoosId = 11;
                    console.log('[十殿模拟] 使用一阶段');
                  }
                }
                
                const inputOptions = new Map();
                const battleOptions = new Map();
                const Configs = window.__require('Configs');
                const nightmareConfig = Configs.NightMareMonster.getByBossId(monsterBoosId);
                console.log('[十殿模拟] nightmareConfig:', nightmareConfig);
                
                if (!nightmareConfig) {
                  console.error('[十殿模拟] ❌ 未找到配置！monsterBoosId:', monsterBoosId);
                  const TipsManager = window.__require('TipsManager');
                  TipsManager.SHOW_TIP('❌ 未找到配置 (BossId:' + monsterBoosId + ')');
                  return;
                }
                
                if (!nightmareConfig.monsters || nightmareConfig.monsters.length === 0) {
                  console.error('[十殿模拟] ❌ monsters数据无效！');
                  const TipsManager = window.__require('TipsManager');
                  TipsManager.SHOW_TIP('❌ 怪物数据无效');
                  return;
                }
                
                showBattleUI(
                  13, randomSeed, inputOptions, battleOptions, mapId, stageNameStr,
                  nightmareConfig.monsters, nightmareConfig.color || 0,
                  nightmareConfig.legionBossLv, nightmareConfig.legionBossZhanLi,
                  false, [], 0, null, null
                );
                console.log('[十殿模拟] ✅ showBattleUI调用成功');
              } catch (e) {
                console.error('[十殿模拟] ❌ 错误:', e);
                try {
                  const TipsManager = window.__require('TipsManager');
                  TipsManager.SHOW_TIP('❌ 十殿模拟错误: ' + e.message);
                } catch (e2) {}
              }
            };
            
            const normalBtn = UI_BtnSmall.createInstance();
            normalBtn.getChild('title').text = '开始模拟';
            normalBtn.node.setPosition(btnTeamPos.x + 100, btnTeamPos.y + 390);
            normalBtn.onClick(() => {
              const bossId = this.m_bossList.getFirstChildInView() + 1;
              simulateBattle(bossId, null);
            });
            this.addChild(normalBtn);
            
            const stage1Btn = UI_BtnSmall.createInstance();
            stage1Btn.getChild('title').text = '模拟一阶段';
            stage1Btn.node.setPosition(btnTeamPos.x + 100, btnTeamPos.y + 390);
            stage1Btn.onClick(() => simulateBattle(9, 1));
            this.addChild(stage1Btn);
            
            const stage2Btn = UI_BtnSmall.createInstance();
            stage2Btn.getChild('title').text = '模拟二阶段';
            stage2Btn.node.setPosition(btnTeamPos.x + 100, btnTeamPos.y + 320);
            stage2Btn.onClick(() => simulateBattle(9, 2));
            this.addChild(stage2Btn);
            
            const updateButtons = () => {
              const bossId = this.m_bossList.getFirstChildInView() + 1;
              const isStage9 = bossId === 9;
              normalBtn.node.active = !isStage9;
              stage1Btn.node.active = isStage9;
              stage2Btn.node.active = isStage9;
            };
            updateButtons();
            
            this.m_bossList.node.on('scroll-ended', updateButtons);
            this.m_bossList.node.on('touchend', updateButtons);

            if (!UI_NightmarePanel.env) {
              UI_NightmarePanel.env = { isStop: true };
            }
            const checkBattleBtn = UI_BtnSmall.createInstance();
            checkBattleBtn.getChild('title').text = UI_NightmarePanel.env.isStop
              ? '检测概率'
              : '停止检测';
            checkBattleBtn.node.setPosition(btnTeamPos.x - 100, btnTeamPos.y + 390);
            checkBattleBtn.onClick(async () => {
              UI_NightmarePanel.env.isStop = !UI_NightmarePanel.env.isStop;
              if (UI_NightmarePanel.env.isStop) {
                UI_NightmarePanel.env = { isStop: true };
              }
              checkBattleBtn.getChild('title').text = UI_NightmarePanel.env.isStop
                ? '检测概率'
                : '停止检测';
              if (!UI_NightmarePanel.env.isStop) {
                const bossId = this.m_bossList.getFirstChildInView() + 1;
                let stageNameStr = `十殿${bossId}`;
                let monsterBoosId = bossId;
                if (bossId == 9) {
                  const GET_PROXY = window.__require('index-ui').GET_PROXY;
                  const nightmarePanel = GET_PROXY(window.__require('NightmarePanel').NightmarePanel);
                  if (nightmarePanel._nightmare9swap) {
                    stageNameStr = `十殿9 二阶段`;
                    monsterBoosId = 12;
                  } else {
                    stageNameStr = `十殿9 一阶段`;
                    monsterBoosId = 11;
                  }
                }
                const battleOptions = new Map();
                const Configs = window.__require('Configs');
                const nightmareConfig = Configs.NightMareMonster.getByBossId(monsterBoosId);
                checkBattleProbility(
                  stageNameStr,
                  UI_NightmarePanel.env,
                  13,
                  battleOptions,
                  nightmareConfig.monsters,
                  nightmareConfig.color || 0,
                  false,
                  []
                );
              }
            });
            this.addChild(checkBattleBtn);
          };
          UI_NightmarePanel.prototype.onConstruct.isSelfCreate = true;
          console.log('[battle-sim-patch] 十殿阎罗模拟功能已加载');
        }
      } catch (e) {}

      // 十殿星级挑战模拟
      try {
        const UI_NightmareStarPanel = ccRequire('UI_NightmareStarPanel').default;
        const oldNightmareStarPanelOnConstruct = UI_NightmareStarPanel.prototype.onConstruct;
        if (!oldNightmareStarPanelOnConstruct.isSelfCreate) {
          UI_NightmareStarPanel.prototype.onConstruct = function () {
            oldNightmareStarPanelOnConstruct.call(this);

            const btnFightPos = this.m_btnFight.node.getPosition();
            const UI_BtnSmall = ccRequire('UI_BtnSmall').default;
            const randomBattleBtn = UI_BtnSmall.createInstance();
            randomBattleBtn.getChild('title').text = '开始模拟';
            randomBattleBtn.node.setPosition(btnFightPos.x + 100, btnFightPos.y + 390);
            randomBattleBtn.onClick(() => {
              const bossId = this.m_bossListComp.m_bossList.getFirstChildInView() + 1;
              const randomSeed = window.TestSeed || Math.floor(Math.random() * 9999) + 1;
              const stageNameStr = `模拟挑战${bossId}`;

              const Configs = window.__require('Configs');
              const GET_MODULE = window.__require('ModuleManager').GET_MODULE;
              const nightmareModule = GET_MODULE(Configs.ModuleType.NIGHTMARE);
              const nowStarTaskDescList =
                nightmareModule.extendData.getNowStarTaskDescList(bossId);
              const maxStarCount = nightmareModule.extendData.getStarCountByBossId(bossId);
              const nowStarIdxList = [];
              const inputOptions = new Map();
              const nmStarBattleInputParas = {
                bossId: bossId,
                maxStarCount: maxStarCount,
                nowStarCount: nowStarIdxList.length,
                nowStarIdxList: nowStarIdxList,
                nowStarTaskDescList: nowStarTaskDescList,
                remainStarFightCount: 0,
                battleTeam: new Map(),
                lordWeaponId: 0
              };
              inputOptions.set('NMStarBattleInputParasKey', nmStarBattleInputParas);
              const battleOptions = new Map();
              const nightmareStarConfig = Configs.NightMareStarConf.getByBossId(bossId);

              showBattleUI(
                37,
                randomSeed,
                inputOptions,
                battleOptions,
                Configs.NightMareStarConstant.config.nightMareStarMapId,
                stageNameStr,
                nightmareStarConfig.monsters,
                0,
                nightmareStarConfig.legionBossLv,
                nightmareStarConfig.legionBossZhanLi,
                false,
                [],
                0,
                (battleResult) => {
                  if (battleResult.isWin) {
                    nowStarIdxList.length = 0;
                    for (
                      let idx = 0;
                      idx < nightmareStarConfig.nightMareStarConditionType.length;
                      idx++
                    ) {
                      const conditionType = nightmareStarConfig.nightMareStarConditionType[idx];
                      const conditionValue = nightmareStarConfig.nightMareStarConditionValue[idx];
                      if (battleResult.round > conditionValue) {
                        continue;
                      }
                      if (conditionType == 2) {
                        let hasDieHero = false;
                        for (const hero of battleResult.sponsor.teamInfo) {
                          if (hero.hp <= 0) {
                            hasDieHero = true;
                            break;
                          }
                        }
                        if (hasDieHero) {
                          continue;
                        }
                      }
                      nowStarIdxList.push(idx);
                    }
                    nmStarBattleInputParas.nowStarCount = nowStarIdxList.length;
                  }
                }
              );
            });
            this.addChild(randomBattleBtn);

            if (!UI_NightmareStarPanel.env) {
              UI_NightmareStarPanel.env = { isStop: true, counts: [0, 0, 0, 0] };
            }
            const checkBattleBtn = UI_BtnSmall.createInstance();
            checkBattleBtn.getChild('title').text = UI_NightmareStarPanel.env.isStop
              ? '检测概率'
              : '停止检测';
            checkBattleBtn.node.setPosition(btnFightPos.x - 100, btnFightPos.y + 390);
            checkBattleBtn.onClick(async () => {
              const TipsManager = window.__require('TipsManager');
              UI_NightmareStarPanel.env.isStop = !UI_NightmareStarPanel.env.isStop;
              if (UI_NightmareStarPanel.env.isStop) {
                UI_NightmareStarPanel.env = { isStop: true, counts: [0, 0, 0, 0] };
              }
              checkBattleBtn.getChild('title').text = UI_NightmareStarPanel.env.isStop
                ? '检测概率'
                : '停止检测';
              if (!UI_NightmareStarPanel.env.isStop) {
                const bossId = this.m_bossListComp.m_bossList.getFirstChildInView() + 1;
                const Configs = window.__require('Configs');
                const battleOptions = new Map();
                const nightmareStarConfig = Configs.NightMareStarConf.getByBossId(bossId);
                checkBattleProbility(
                  `星级挑战${bossId}`,
                  UI_NightmareStarPanel.env,
                  37,
                  battleOptions,
                  nightmareStarConfig.monsters,
                  0,
                  false,
                  [],
                  0,
                  (battleResult, env) => {
                    if (battleResult) {
                      if (battleResult.isWin) {
                        let starCount = 0;
                        for (
                          let idx = 0;
                          idx < nightmareStarConfig.nightMareStarConditionType.length;
                          idx++
                        ) {
                          const conditionType =
                            nightmareStarConfig.nightMareStarConditionType[idx];
                          const conditionValue =
                            nightmareStarConfig.nightMareStarConditionValue[idx];
                          if (battleResult.round > conditionValue) {
                            continue;
                          }
                          if (conditionType == 2) {
                            let hasDieHero = false;
                            for (const hero of battleResult.sponsor.teamInfo) {
                              if (hero.hp <= 0) {
                                hasDieHero = true;
                                break;
                              }
                            }
                            if (hasDieHero) {
                              continue;
                            }
                          }
                          starCount++;
                        }
                        env.counts[starCount]++;
                      } else {
                        env.counts[0]++;
                      }
                    }
                    const total = env.counts[0] + env.counts[1] + env.counts[2] + env.counts[3];
                    if (total % 10 == 0 || total >= 9999) {
                      TipsManager.SHOW_TIP(
                        `次数:${total} 0星:${((100 * env.counts[0]) / total).toFixed(0)}% 1星:${((100 * env.counts[1]) / total).toFixed(0)}% 2星:${((100 * env.counts[2]) / total).toFixed(0)}% 3星:${((100 * env.counts[3]) / total).toFixed(0)}%`
                      );
                    }
                  }
                );
              }
            });
            this.addChild(checkBattleBtn);
          };
          UI_NightmareStarPanel.prototype.onConstruct.isSelfCreate = true;
        }
      } catch (e) {}

      // 幽冥试炼模拟
      try {
        const UI_NightmareRacePanel = ccRequire('UI_NightmareRacePanel').default;
        const oldNightmareRacePanelOnConstruct = UI_NightmareRacePanel.prototype.onConstruct;
        if (!oldNightmareRacePanelOnConstruct.isSelfCreate) {
          UI_NightmareRacePanel.prototype.onConstruct = function () {
            oldNightmareRacePanelOnConstruct.call(this);

            const btnFightPos = this.m_btnFight.node.getPosition();
            const UI_BtnSmall = ccRequire('UI_BtnSmall').default;
            const randomBattleBtn = UI_BtnSmall.createInstance();
            randomBattleBtn.getChild('title').text = '开始模拟';
            randomBattleBtn.node.setPosition(btnFightPos.x + 100, btnFightPos.y + 130);
            randomBattleBtn.onClick(() => {
              const Configs = window.__require('Configs');
              const GET_MODULE = window.__require('ModuleManager').GET_MODULE;
              const ModuleType = window.__require('Configs').ModuleType;
              const nightmareModule = GET_MODULE(ModuleType.NIGHTMARE);
              const bossId = nightmareModule.extendData.conf.bossId || 1;
              const randomSeed = window.TestSeed || Math.floor(Math.random() * 9999) + 1;

              const raceBossConfig = Configs.NightMareRaceMonsterConf.getByBossId(bossId);
              if (!raceBossConfig) {
                console.error('未找到幽冥试炼BOSS配置:', bossId);
                return;
              }

              console.log('[幽冥试炼] raceBossConfig:', raceBossConfig);
              console.log('[幽冥试炼] monsters:', raceBossConfig.monsters);

              const stageNameStr = `幽冥试炼`;
              const mapId = Configs.NightMareRaceConstant.config.nightMareRaceMapId || 38;

              const inputOptions = new Map();
              // 添加幽冥试炼特殊参数
              const nmRaceBattleInputParas = {
                scoreText: raceBossConfig.nightMareRaceRankConditionShow || '',
                isNewRecord: false,
                highestRecord: 0,
                remainRaceFightCount: 999,
                battleTeam: new Map(),
                lordWeaponId: 0
              };
              inputOptions.set('NMRaceBattleInputParasKey', nmRaceBattleInputParas);

              const battleOptions = new Map();

              showBattleUI(
                38,  // 幽冥试炼的战斗模式
                randomSeed,
                inputOptions,
                battleOptions,
                mapId,
                stageNameStr,
                raceBossConfig.monsters,
                6,  // 幽冥试炼的 legacyColor
                raceBossConfig.legionBossLv,
                raceBossConfig.legionBossZhanLi,
                false,
                [],
                30  // 幽冥试炼的最大回合数
              );
            });
            this.addChild(randomBattleBtn);

            if (!UI_NightmareRacePanel.env) {
              UI_NightmareRacePanel.env = { isStop: true };
            }
            const checkBattleBtn = UI_BtnSmall.createInstance();
            checkBattleBtn.getChild('title').text = UI_NightmareRacePanel.env.isStop
              ? '检测概率'
              : '停止检测';
            checkBattleBtn.node.setPosition(btnFightPos.x - 100, btnFightPos.y + 130);
            checkBattleBtn.onClick(async () => {
              UI_NightmareRacePanel.env.isStop = !UI_NightmareRacePanel.env.isStop;
              if (UI_NightmareRacePanel.env.isStop) {
                UI_NightmareRacePanel.env = { isStop: true };
              }
              checkBattleBtn.getChild('title').text = UI_NightmareRacePanel.env.isStop
                ? '检测概率'
                : '停止检测';
              if (!UI_NightmareRacePanel.env.isStop) {
                const Configs = window.__require('Configs');
                const GET_MODULE = window.__require('ModuleManager').GET_MODULE;
                const ModuleType = window.__require('Configs').ModuleType;
                const nightmareModule = GET_MODULE(ModuleType.NIGHTMARE);
                const bossId = nightmareModule.extendData.conf.bossId || 1;

                const raceBossConfig = Configs.NightMareRaceMonsterConf.getByBossId(bossId);
                if (!raceBossConfig) {
                  console.error('未找到幽冥试炼BOSS配置:', bossId);
                  return;
                }

                const battleOptions = new Map();
                checkBattleProbility(
                  `幽冥试炼${bossId}`,
                  UI_NightmareRacePanel.env,
                  38,  // 幽冥试炼的战斗模式
                  battleOptions,
                  raceBossConfig.monsters,
                  6,  // 幽冥试炼的 legacyColor
                  false,
                  [],
                  30  // 幽冥试炼的最大回合数
                );
              }
            });
            this.addChild(checkBattleBtn);
          };
          UI_NightmareRacePanel.prototype.onConstruct.isSelfCreate = true;
          console.log('[battle-sim-patch] 幽冥试炼模拟功能已加载');
        }
      } catch (e) {}

      // 怪异塔模拟
      try {
        const UI_EvoTowerMainPanel = ccRequire('UI_EvoTowerMainPanel').default;
        const oldEvoTowerMainPanelOnConstruct = UI_EvoTowerMainPanel.prototype.onConstruct;
        if (!oldEvoTowerMainPanelOnConstruct.isSelfCreate) {
          UI_EvoTowerMainPanel.prototype.onConstruct = function () {
            oldEvoTowerMainPanelOnConstruct.call(this);

            const getBattleInfo = () => {
              const Configs = window.__require('Configs');
              const GET_MODULE = window.__require('ModuleManager').GET_MODULE;
              const ModuleType = window.__require('Configs').ModuleType;
              const evoTowerModule = GET_MODULE(ModuleType.EVOTOWER);

              const addAttributes = [];
              const maxClubPrivilegeId = evoTowerModule.privilegeData.evoTowerClubPrivilegeLevel;
              if (maxClubPrivilegeId > 0) {
                Configs.EvoTowerClubPrivilegeConf.list.forEach((conf) => {
                  if (conf.Id == maxClubPrivilegeId) {
                    for (const attrs of conf.attrReward) {
                      addAttributes.push(...attrs);
                    }
                  }
                });
              }
              for (let day = 0; day < evoTowerModule.evoTower.orderPassReward.size; day++) {
                addAttributes.push(...Configs.EvoTowerConstant.config.privilegeAttrReward);
              }

              let evoTowerPrivilegeLevel = 0;
              if (evoTowerModule.privilegeData.evoTowerPrivilege) {
                evoTowerPrivilegeLevel = evoTowerModule.scheduleData.actPassedDays;
              }
              const towerId = (evoTowerModule.evoTower.towerId || 0) + 1;
              const evoTowerConfig = Configs.EvoTowerConf.getById(towerId);
              const mapId = evoTowerModule.getMapId(towerId);
              const towerIdx = Math.floor(evoTowerModule.evoTower.towerId / 10) + 1;
              const layerIdx = (evoTowerModule.evoTower.towerId + 1) % 10 || 10;
              const towerName = `${towerIdx}-${layerIdx}`;
              return {
                addAttributes,
                towerId,
                towerName,
                mapId,
                evoTowerConfig,
                evoTowerPrivilegeLevel
              };
            };

            const btnBackPos = this.m_btnSelfBack.node.getPosition();
            const UI_BtnSmall = ccRequire('UI_BtnSmall').default;
            const randomBattleBtn = UI_BtnSmall.createInstance();
            randomBattleBtn.getChild('title').text = '开始模拟';
            randomBattleBtn.node.setPosition(btnBackPos.x + 20, btnBackPos.y + 310);
            randomBattleBtn.onClick(async () => {
              const randomSeed = window.TestSeed || Math.floor(Math.random() * 9999) + 1;
              const inputOptions = new Map();
              const battleOptions = new Map();
              const battleInfo = getBattleInfo();
              const stageNameStr = `模拟怪异塔${battleInfo.towerName}`;
              battleOptions.set('towerId', battleInfo.towerId);
              inputOptions.set('reward', []);
              inputOptions.set('towerEnergy', 0);
              inputOptions.set('evoTowerPrivilegeLevel', battleInfo.evoTowerPrivilegeLevel);
              inputOptions.set('evoTowerAutoBattle', 0);
              const GET_MODULE = window.__require('ModuleManager').GET_MODULE;
              const ModuleType = window.__require('Configs').ModuleType;
              const evoTowerModule = GET_MODULE(ModuleType.EVOTOWER);
              let recordEnergy = evoTowerModule.evoTower.energy;
              showBattleUI(
                35,
                randomSeed,
                inputOptions,
                battleOptions,
                battleInfo.mapId,
                stageNameStr,
                battleInfo.evoTowerConfig.monsters,
                battleInfo.evoTowerConfig.color,
                battleInfo.evoTowerConfig.monstersLv,
                battleInfo.evoTowerConfig.zhanLi,
                false,
                battleInfo.addAttributes,
                0,
                (battleReulst) => {
                  recordEnergy = evoTowerModule.evoTower.energy;
                  evoTowerModule.evoTower.energy = 0;
                },
                () => {
                  evoTowerModule.evoTower.energy = recordEnergy;
                }
              );
            });
            this.addChild(randomBattleBtn);

            if (!UI_EvoTowerMainPanel.env) {
              UI_EvoTowerMainPanel.env = { isStop: true };
            }
            const checkBattleBtn = UI_BtnSmall.createInstance();
            checkBattleBtn.getChild('title').text = UI_EvoTowerMainPanel.env.isStop
              ? '检测概率'
              : '停止检测';
            checkBattleBtn.node.setPosition(btnBackPos.x + 20, btnBackPos.y + 380);
            checkBattleBtn.onClick(async () => {
              UI_EvoTowerMainPanel.env.isStop = !UI_EvoTowerMainPanel.env.isStop;
              if (UI_EvoTowerMainPanel.env.isStop) {
                UI_EvoTowerMainPanel.env = { isStop: true };
              }
              checkBattleBtn.getChild('title').text = UI_EvoTowerMainPanel.env.isStop
                ? '检测概率'
                : '停止检测';
              if (!UI_EvoTowerMainPanel.env.isStop) {
                const battleInfo = getBattleInfo();
                const battleOptions = new Map();
                battleOptions.set('towerId', battleInfo.towerId);
                checkBattleProbility(
                  `怪异塔${battleInfo.towerName}`,
                  UI_EvoTowerMainPanel.env,
                  35,
                  battleOptions,
                  battleInfo.evoTowerConfig.monsters,
                  battleInfo.evoTowerConfig.color,
                  false,
                  battleInfo.addAttributes
                );
              }
            });
            this.addChild(checkBattleBtn);
          };
          UI_EvoTowerMainPanel.prototype.onConstruct.isSelfCreate = true;
          console.log('[battle-sim-patch] 怪异塔模拟功能已加载');
        }
      } catch (e) {}

      // 咸将塔模拟
      try {
        const UI_TowerMainPanel = ccRequire('UI_TowerMainPanel').default;
        const oldTowerMainPanelOnConstruct = UI_TowerMainPanel.prototype.onConstruct;
        if (!oldTowerMainPanelOnConstruct.isSelfCreate) {
          UI_TowerMainPanel.prototype.onConstruct = function () {
            oldTowerMainPanelOnConstruct.call(this);

            const btnBackPos = this.m_btnSelfBack.node.getPosition();
            const UI_BtnSmall = ccRequire('UI_BtnSmall').default;
            const randomBattleBtn = UI_BtnSmall.createInstance();
            randomBattleBtn.getChild('title').text = '开始模拟';
            randomBattleBtn.node.setPosition(btnBackPos.x + 20, btnBackPos.y + 110);
            randomBattleBtn.onClick(async () => {
              const randomSeed = window.TestSeed || Math.floor(Math.random() * 9999) + 1;

              const Configs = window.__require('Configs');
              const GET_MODULE = window.__require('ModuleManager').GET_MODULE;
              const ModuleType = window.__require('Configs').ModuleType;
              const towerModule = GET_MODULE(ModuleType.TOWER);

              const inputOptions = new Map();
              const battleOptions = new Map();
              const towerId = Math.min(ROLE.tower.id + 1, 4500);
              const towerIdx = Math.floor((towerId - 1) / 10) + 1;
              const layerIdx = towerId % 10 || 10;
              const towerConfig = Configs.TowerConf.getById(towerId);
              const stageNameStr = `模拟咸将塔${towerIdx}-${layerIdx}`;
              const mapId = towerModule.getMapId(towerId);
              battleOptions.set('towerId', towerId);

              showBattleUI(
                2,
                randomSeed,
                inputOptions,
                battleOptions,
                mapId,
                stageNameStr,
                towerConfig.monsters,
                0,
                towerConfig.monstersLv,
                towerConfig.zhanLi,
                false,
                [],
                0,
                (battleReulst) => {},
                () => {}
              );
            });
            this.addChild(randomBattleBtn);

            if (!UI_TowerMainPanel.env) {
              UI_TowerMainPanel.env = { isStop: true };
            }
            const checkBattleBtn = UI_BtnSmall.createInstance();
            checkBattleBtn.getChild('title').text = UI_TowerMainPanel.env.isStop
              ? '检测概率'
              : '停止检测';
            checkBattleBtn.node.setPosition(btnBackPos.x + 20, btnBackPos.y + 180);
            checkBattleBtn.onClick(async () => {
              UI_TowerMainPanel.env.isStop = !UI_TowerMainPanel.env.isStop;
              if (UI_TowerMainPanel.env.isStop) {
                UI_TowerMainPanel.env = { isStop: true };
              }
              checkBattleBtn.getChild('title').text = UI_TowerMainPanel.env.isStop
                ? '检测概率'
                : '停止检测';
              if (!UI_TowerMainPanel.env.isStop) {
                const Configs = window.__require('Configs');

                const battleOptions = new Map();
                const towerId = Math.min(ROLE.tower.id + 1, 4500);
                const towerIdx = Math.floor((towerId - 1) / 10) + 1;
                const layerIdx = towerId % 10 || 10;
                const towerConfig = Configs.TowerConf.getById(towerId);
                battleOptions.set('towerId', towerId);
                checkBattleProbility(
                  `咸将塔${towerIdx}-${layerIdx}`,
                  UI_TowerMainPanel.env,
                  2,
                  battleOptions,
                  towerConfig.monsters,
                  0,
                  false,
                  []
                );
              }
            });
            this.addChild(checkBattleBtn);
          };
          UI_TowerMainPanel.prototype.onConstruct.isSelfCreate = true;
          console.log('[battle-sim-patch] 咸将塔模拟功能已加载');
        }
      } catch (e) {}

      // 灯神模拟
      try {
        const GeniePanel = window.__require('GeniePanel').GeniePanel;
        const oldGeniePanelOnShown = GeniePanel.prototype.onShown;
        if (!oldGeniePanelOnShown.isSelfCreate) {
          GeniePanel.prototype.onShown = function () {
            oldGeniePanelOnShown.call(this);

            const UIWindow = window.__require('index-ui').UIWindow;
            const skin = this.getComponent(UIWindow).skin;

            const btnBackPos = skin.m_btnBack.node.getPosition();
            const UI_BtnSmall = ccRequire('UI_BtnSmall').default;
            const randomBattleBtn = UI_BtnSmall.createInstance();
            randomBattleBtn.getChild('title').text = '开始模拟';
            randomBattleBtn.node.setPosition(btnBackPos.x + 145, btnBackPos.y - 40);
            randomBattleBtn.onClick(async () => {
              const randomSeed = window.TestSeed || Math.floor(Math.random() * 9999) + 1;
              const inputOptions = new Map();
              const battleOptions = new Map();

              let genieType = 0;
              if (this.ui.m_isPearl.selectedPage == 'true') {
                genieType = 5;
              } else {
                genieType = this._selectIdx + 1;
              }
              const Configs = window.__require('Configs');
              const curIdx = ROLE.genie.get(genieType) || -1;
              const targetIdx = Math.min(curIdx + 2, genieType == 5 ? 10 : 17);
              const genieLevelId = genieType * 1000 + targetIdx;
              const genieConfig = Configs.GenieLevelConf.getById(genieLevelId);
              const mapId = [70001, 70001, 70002, 70003, 70004, 70005][genieType];
              battleOptions.set('genieLevelId', genieLevelId);
              const genieNames = ['', '魏国', '蜀国', '吴国', '群雄', '深海'];
              const stageNameStr = `模拟${genieNames[genieType]}灯神${targetIdx}`;

              showBattleUI(
                9,
                randomSeed,
                inputOptions,
                battleOptions,
                mapId,
                stageNameStr,
                genieConfig.monsters,
                0,
                genieConfig.monstersLv,
                genieConfig.zhanLi,
                false,
                [],
                0,
                (battleReulst) => {},
                () => {}
              );
            });
            skin.addChild(randomBattleBtn);

            if (!GeniePanel.env) {
              GeniePanel.env = { isStop: true };
            }
            const checkBattleBtn = UI_BtnSmall.createInstance();
            checkBattleBtn.getChild('title').text = GeniePanel.env.isStop
              ? '检测概率'
              : '停止检测';
            checkBattleBtn.node.setPosition(btnBackPos.x + 145, btnBackPos.y + 30);
            checkBattleBtn.onClick(async () => {
              GeniePanel.env.isStop = !GeniePanel.env.isStop;
              if (GeniePanel.env.isStop) {
                GeniePanel.env = { isStop: true };
              }
              checkBattleBtn.getChild('title').text = GeniePanel.env.isStop
                ? '检测概率'
                : '停止检测';
              if (!GeniePanel.env.isStop) {
                const battleOptions = new Map();
                const Configs = window.__require('Configs');
                let genieType = 0;
                if (this.ui.m_isPearl.selectedPage == 'true') {
                  genieType = 5;
                } else {
                  genieType = this._selectIdx + 1;
                }
                const curIdx = ROLE.genie.get(genieType) || -1;
                const targetIdx = Math.min(curIdx + 2, genieType == 5 ? 10 : 17);
                const genieLevelId = genieType * 1000 + targetIdx;
                const genieConfig = Configs.GenieLevelConf.getById(genieLevelId);
                const genieNames = ['', '魏国', '蜀国', '吴国', '群雄', '深海'];
                checkBattleProbility(
                  `${genieNames[genieType]}灯神${targetIdx}`,
                  GeniePanel.env,
                  9,
                  battleOptions,
                  genieConfig.monsters,
                  0,
                  false,
                  []
                );
              }
            });
            skin.addChild(checkBattleBtn);
          };
          GeniePanel.prototype.onShown.isSelfCreate = true;
          console.log('[battle-sim-patch] 灯神模拟功能已加载');
        }

        // 俱乐部Boss模拟
        const UI_LegionAttackInfoDialog = ccRequire('UI_LegionAttackInfoDialog').default;
        const oldLegionAttackInfoDialogOnConstruct = UI_LegionAttackInfoDialog.prototype.onConstruct;
        if (!oldLegionAttackInfoDialogOnConstruct.isSelfCreate) {
          UI_LegionAttackInfoDialog.prototype.onConstruct = function () {
            oldLegionAttackInfoDialogOnConstruct.call(this);

            const btnAttackPos = this.m_btnAttack.node.getPosition();
            const UI_BtnSmall = ccRequire('UI_BtnSmall').default;
            const randomBattleBtn = UI_BtnSmall.createInstance();
            randomBattleBtn.getChild('title').text = '开始模拟';
            randomBattleBtn.node.setPosition(btnAttackPos.x, btnAttackPos.y - 120);
            randomBattleBtn.onClick(async () => {
              const randomSeed = window.TestSeed || Math.floor(Math.random() * 9999) + 1;

              const Configs = ccRequire('Configs');
              const GET_MODULE = ccRequire('ModuleManager').GET_MODULE;
              const ModuleType = Configs.ModuleType;
              const legionModule = GET_MODULE(ModuleType.LEGION);
              const bossId = legionModule.currentBossInfo.legionBossId;
              const bossConfig = Configs.LegionBossConf.getByLegionBossId(bossId);

              const inputOptions = new Map();
              const battleOptions = new Map();
              const stageNameStr = `模拟俱乐部boss`;
              const mapId = ROLE.pvpMapId;
              battleOptions.set('legionBossId', bossId);

              showBattleUI(
                6,
                randomSeed,
                inputOptions,
                battleOptions,
                mapId,
                stageNameStr,
                bossConfig.monsters,
                0,
                '???',
                bossConfig.legionBossZhanLi,
                false,
                [],
                0,
                (battleResult) => {},
                () => {}
              );
            });
            this.addChild(randomBattleBtn);
          };
          UI_LegionAttackInfoDialog.prototype.onConstruct.isSelfCreate = true;
          console.log('[battle-sim-patch] 俱乐部Boss模拟功能已加载');
        }
      } catch (e) {}

      // BattleConst 设置
      try {
        const BattleConst = ccRequire('battle-const').BattleConst;
        BattleConst.INSPECT_PLAYBACK = false;
      } catch (e) {}

      window.__require.battleSimPatched = true;
    }
  } catch (e) {}
}

      } catch (err) { return; }
    }, 200);
  }
}


// ===== 道具自动合成 =====
(function () {
  "use strict";

  var INSTALLED_KEY = "__xyzwQuickMergeUnlockInstalled";
  if (window[INSTALLED_KEY]) {
    return;
  }
  window[INSTALLED_KEY] = true;

  var ACT_ID = "251212";
  var ACT_ID_NUM = 251212;
  var LOG_PREFIX = "[QuickMergeUnlock]";
  var UNLOCK_METHOD = "checkSatisfyUnlockAutoMerge";
  var EXIST_METHOD = "checkExistMergeItems";
  var AUTO_MERGE_METHOD = "sendAutoMergeItems";
  var EMISSION_CAN_LAUNCH = 1;
  var KEY_BATCH_SIZE = 20;
  var KEY_USE_DELAY = 0;
  var ACTION_DELAY = 5;
  var CLAIM_DELAY = 30;
  var automationRunning = false;
  var automationStopTimer = null;
  var watchedRewardPromises = [];

  function setAutomationRunning(value) {
    clearTimeout(automationStopTimer);

    if (value) {
      automationRunning = true;
      return;
    }

    automationStopTimer = setTimeout(function () {
      automationRunning = false;
    }, 5000);
  }

  function isTargetAct(context) {
    return context && (context.actId === ACT_ID_NUM || context.actId === ACT_ID);
  }

  function installUnlockMethodHook() {
    var originalDescriptor = Object.getOwnPropertyDescriptor(
      Object.prototype,
      UNLOCK_METHOD
    );

    if (originalDescriptor && !originalDescriptor.configurable) {
      return;
    }

    function restoreDescriptor() {
      try {
        if (originalDescriptor) {
          Object.defineProperty(Object.prototype, UNLOCK_METHOD, originalDescriptor);
        } else {
          delete Object.prototype[UNLOCK_METHOD];
        }
      } catch (err) {}
    }

    try {
      Object.defineProperty(Object.prototype, UNLOCK_METHOD, {
        configurable: true,
        get: function () {
          if (originalDescriptor && typeof originalDescriptor.get === "function") {
            return originalDescriptor.get.call(this);
          }
          return undefined;
        },
        set: function (method) {
          var wrappedMethod = method;

          if (typeof method === "function") {
            wrappedMethod = function () {
              if (isTargetAct(this)) {
                return true;
              }
              return method.apply(this, arguments);
            };
          }

          Object.defineProperty(this, UNLOCK_METHOD, {
            configurable: true,
            writable: true,
            value: wrappedMethod,
          });

          restoreDescriptor();

          try {
            console.log(LOG_PREFIX, UNLOCK_METHOD, "hooked for act", ACT_ID);
          } catch (err) {}
        },
      });
    } catch (err2) {
      try {
        console.warn(LOG_PREFIX, "method hook failed", err2);
      } catch (logErr) {}
    }
  }

  installUnlockMethodHook();

  function installTargetAlwaysTrueHook(methodName) {
    var originalDescriptor = Object.getOwnPropertyDescriptor(
      Object.prototype,
      methodName
    );

    if (originalDescriptor && !originalDescriptor.configurable) {
      return;
    }

    function restoreDescriptor() {
      try {
        if (originalDescriptor) {
          Object.defineProperty(Object.prototype, methodName, originalDescriptor);
        } else {
          delete Object.prototype[methodName];
        }
      } catch (err) {}
    }

    try {
      Object.defineProperty(Object.prototype, methodName, {
        configurable: true,
        get: function () {
          if (originalDescriptor && typeof originalDescriptor.get === "function") {
            return originalDescriptor.get.call(this);
          }
          return undefined;
        },
        set: function (method) {
          var wrappedMethod = method;

          if (typeof method === "function") {
            wrappedMethod = function () {
              if (isTargetAct(this)) {
                return true;
              }
              return method.apply(this, arguments);
            };
          }

          Object.defineProperty(this, methodName, {
            configurable: true,
            writable: true,
            value: wrappedMethod,
          });

          restoreDescriptor();

          try {
            console.log(LOG_PREFIX, methodName, "hooked for act", ACT_ID);
          } catch (err) {}
        },
      });
    } catch (err2) {
      try {
        console.warn(LOG_PREFIX, methodName, "hook failed", err2);
      } catch (logErr) {}
    }
  }

  installTargetAlwaysTrueHook(EXIST_METHOD);

  function installAutoMergeMethodHook() {
    var originalDescriptor = Object.getOwnPropertyDescriptor(
      Object.prototype,
      AUTO_MERGE_METHOD
    );

    if (originalDescriptor && !originalDescriptor.configurable) {
      return;
    }

    function restoreDescriptor() {
      try {
        if (originalDescriptor) {
          Object.defineProperty(Object.prototype, AUTO_MERGE_METHOD, originalDescriptor);
        } else {
          delete Object.prototype[AUTO_MERGE_METHOD];
        }
      } catch (err) {}
    }

    try {
      Object.defineProperty(Object.prototype, AUTO_MERGE_METHOD, {
        configurable: true,
        get: function () {
          if (originalDescriptor && typeof originalDescriptor.get === "function") {
            return originalDescriptor.get.call(this);
          }
          return undefined;
        },
        set: function (method) {
          var wrappedMethod = method;

          if (typeof method === "function") {
            wrappedMethod = function () {
              if (isTargetAct(this)) {
                return runManualAutoMerge(this);
              }
              return method.apply(this, arguments);
            };
          }

          Object.defineProperty(this, AUTO_MERGE_METHOD, {
            configurable: true,
            writable: true,
            value: wrappedMethod,
          });

          restoreDescriptor();

          try {
            console.log(LOG_PREFIX, AUTO_MERGE_METHOD, "hooked for act", ACT_ID);
          } catch (err) {}
        },
      });
    } catch (err2) {
      try {
        console.warn(LOG_PREFIX, "auto merge hook failed", err2);
      } catch (logErr) {}
    }
  }

  function wait(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function tapGameCanvas(reason) {
    var target =
      document.getElementById("GameCanvas") ||
      document.querySelector("canvas") ||
      document.body;
    var targets;
    var rect;
    var x;
    var y;

    if (!target) {
      return;
    }

    rect =
      typeof target.getBoundingClientRect === "function"
        ? target.getBoundingClientRect()
        : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
    x = rect.left + rect.width * 0.5;
    y = rect.top + rect.height * 0.72;
    targets = [target, document, window];

    function dispatchAll(eventFactory) {
      var index;

      for (index = 0; index < targets.length; index += 1) {
        try {
          targets[index].dispatchEvent(eventFactory());
        } catch (err) {}
      }
    }

    function emitPointer(type, buttons) {
      if (typeof PointerEvent !== "function") {
        return;
      }

      dispatchAll(function () {
        return new PointerEvent(type, {
              bubbles: true,
              cancelable: true,
          pointerType: "touch",
              clientX: x,
              clientY: y,
              screenX: x,
              screenY: y,
              button: 0,
              buttons: buttons,
          pointerId: 1,
          isPrimary: true,
        });
      });
    }

    function emitMouse(type, buttons) {
      dispatchAll(function () {
        return new MouseEvent(type, {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: x,
          clientY: y,
          screenX: x,
          screenY: y,
          button: 0,
          buttons: buttons,
        });
      });
    }

    function emitTouch(type) {
      var touch;

      try {
        if (typeof TouchEvent !== "function" || typeof Touch !== "function") {
          return;
        }

        touch = new Touch({
          identifier: Date.now(),
          target: target,
          clientX: x,
          clientY: y,
          screenX: x,
          screenY: y,
          pageX: x,
          pageY: y,
        });

        dispatchAll(function () {
          return new TouchEvent(type, {
            bubbles: true,
            cancelable: true,
            view: window,
            touches: type === "touchend" ? [] : [touch],
            targetTouches: type === "touchend" ? [] : [touch],
            changedTouches: [touch],
          });
        });
      } catch (err) {}
    }

    function emitFallbackTouch(type) {
      try {
        dispatchAll(function () {
          var event = document.createEvent("Event");
          event.initEvent(type, true, true);
          event.touches = type === "touchend" ? [] : [{ clientX: x, clientY: y }];
          event.targetTouches = event.touches;
          event.changedTouches = [{ clientX: x, clientY: y }];
          return event;
        });
      } catch (err) {}
    }

    emitPointer("pointerdown", 1);
    emitTouch("touchstart");
    emitFallbackTouch("touchstart");
    emitMouse("mousedown", 1);
    emitPointer("pointerup", 0);
    emitTouch("touchend");
    emitFallbackTouch("touchend");
    emitMouse("mouseup", 0);
    emitMouse("click", 0);

    try {
      console.log(LOG_PREFIX, "auto tap", reason || "");
    } catch (err2) {}
  }

  function tapGameCanvasTimes(reason, times) {
    var delays = [700, 900, 1000];
    var index;

    for (index = 0; index < times; index += 1) {
      setTimeout(
        function (tapIndex) {
          return function () {
            tapGameCanvas(reason + ":" + tapIndex);
          };
        }(index + 1),
        delays[index] || delays[delays.length - 1]
      );
    }
  }

  function getIndexUIModule() {
    var names = [
      "index-ui",
      "ui/index-ui",
      "../index-ui",
      "../../ui/index-ui",
      "../../../ui/index-ui",
    ];
    var index;
    var moduleValue;

    if (typeof window.__require !== "function") {
      return null;
    }

    for (index = 0; index < names.length; index += 1) {
      try {
        moduleValue = window.__require(names[index]);
        if (moduleValue && typeof moduleValue.GET_PROXY === "function") {
          return moduleValue;
        }
      } catch (err) {}
    }

    return null;
  }

  function getRewardDialogTypes() {
    var moduleNames = [
      "ItemRewardsDialog",
      "ui/common/ItemRewardsDialog",
      "../common/ItemRewardsDialog",
      "./ItemRewardsDialog",
    ];
    var types = [];
    var index;
    var moduleValue;

    function push(value) {
      if (typeof value === "function" && types.indexOf(value) === -1) {
        types.push(value);
      }
    }

    if (typeof window.__require !== "function") {
      return types;
    }

    for (index = 0; index < moduleNames.length; index += 1) {
      try {
        moduleValue = window.__require(moduleNames[index]);
        if (moduleValue) {
          push(moduleValue.ItemRewardsDialog);
          push(moduleValue.ItemRewardsDialogNoBg);
          push(moduleValue.default);
        }
      } catch (err) {}
    }

    return types;
  }

  function collectRewardDialogInstances(dialogType, result) {
    var items = [];
    var indexUi;
    var proxy;
    var rewardTypes;
    var index;

    function push(value) {
      if (value && items.indexOf(value) === -1) {
        items.push(value);
      }
    }

    push(result);
    if (result && typeof result === "object") {
      push(result.proxy);
      push(result.target);
      push(result.instance);
      push(result.value);
      push(result.result);
    }

    indexUi = getIndexUIModule();
    if (indexUi && dialogType) {
      try {
        proxy = indexUi.GET_PROXY(dialogType);
        push(proxy);
      } catch (err2) {}
    }

    if (indexUi) {
      rewardTypes = getRewardDialogTypes();
      for (index = 0; index < rewardTypes.length; index += 1) {
        try {
          proxy = indexUi.GET_PROXY(rewardTypes[index]);
          push(proxy);
        } catch (err3) {}
      }
    }

    return items;
  }

  function closeRewardDialogInstance(instance, reason) {
    var methods = ["close", "hide"];
    var index;
    var methodName;

    if (!instance || !automationRunning) {
      return false;
    }

    if (instance.isShow === false || instance.visible === false) {
      return true;
    }

    for (index = 0; index < methods.length; index += 1) {
      methodName = methods[index];
      if (typeof instance[methodName] !== "function") {
        continue;
      }

      try {
        instance[methodName]();
        try {
          console.log(LOG_PREFIX, "reward dialog auto close", reason || methodName);
        } catch (logErr) {}
        return true;
      } catch (err) {}
    }

    return false;
  }

  function closeRewardDialog(dialogType, result, reason) {
    var instances = collectRewardDialogInstances(dialogType, result);
    var index;

    for (index = 0; index < instances.length; index += 1) {
      if (closeRewardDialogInstance(instances[index], reason)) {
        return true;
      }
    }

    return false;
  }

  function scheduleRewardDialogClose(dialogType, result, reason) {
    var delays = [700, 900, 1000];
    var index;

    if (result && typeof result.then === "function" && watchedRewardPromises.indexOf(result) === -1) {
      watchedRewardPromises.push(result);
      if (watchedRewardPromises.length > 20) {
        watchedRewardPromises.shift();
      }
      result.then(function (resolved) {
        scheduleRewardDialogClose(dialogType, resolved, reason + ":resolved");
      }).catch(function () {});
    }

    for (index = 0; index < delays.length; index += 1) {
      setTimeout(
        function (tapIndex) {
          return function () {
            closeRewardDialog(dialogType, result, reason + ":" + tapIndex);
          };
        }(index + 1),
        delays[index]
      );
    }
  }

  function scheduleRewardDialogInstanceClose(instance, reason) {
    var stamp;

    if (!instance) {
      return;
    }

    stamp = Date.now();
    instance.__quickMergeRewardCloseStamp = stamp;

    [700, 900, 1000].forEach(function (delay, index) {
      setTimeout(function () {
        if (instance.__quickMergeRewardCloseStamp === stamp) {
          closeRewardDialogInstance(instance, reason + ":" + (index + 1));
        }
      }, delay);
    });
  }

  function installRewardDialogClassHook(dialogType) {
    var proto;

    if (!dialogType || !dialogType.prototype) {
      return;
    }

    proto = dialogType.prototype;
    if (proto.__quickMergeRewardCloseHooked) {
      return;
    }

    ["onShow", "onFixShow", "onShown"].forEach(function (methodName) {
      var original = proto[methodName];

      if (typeof original !== "function") {
        return;
      }

      proto[methodName] = function () {
        var result = original.apply(this, arguments);

        if (automationRunning) {
          scheduleRewardDialogInstanceClose(this, methodName);
        }

        return result;
      };
    });

    proto.__quickMergeRewardCloseHooked = true;
  }

  function installKnownRewardDialogHooks() {
    var rewardTypes = getRewardDialogTypes();
    var index;

    for (index = 0; index < rewardTypes.length; index += 1) {
      installRewardDialogClassHook(rewardTypes[index]);
    }
  }

  function hasRewardsPayload(args) {
    var index;
    var value;

    for (index = 0; index < args.length; index += 1) {
      value = args[index];
      if (!value || typeof value !== "object") {
        continue;
      }

      if (Array.isArray(value.rewards) || Array.isArray(value.reward)) {
        return true;
      }
    }

    return false;
  }

  function isItemRewardsDialog(dialogType) {
    var name;

    if (!dialogType) {
      return false;
    }

    name =
      dialogType.name ||
      dialogType.className ||
      dialogType.__classname__ ||
      dialogType._name ||
      "";

    return String(name).indexOf("ItemRewardsDialog") !== -1;
  }

  function shouldBlockRewardDialog(args) {
    return (
      automationRunning &&
      (hasRewardsPayload(args) || isItemRewardsDialog(args[0]))
    );
  }

  function getSuppressedRewardDialogResult(methodName) {
    if (methodName === "SHOW_DIALOG_DEFERRED") {
      return Promise.resolve(null);
    }

    return null;
  }

  function wrapRewardDialogsOnce() {
    var candidates = [
      window.SHOW_DIALOG_DEFERRED,
      window.SHOW_PROXY,
      window.SHOW_PROXY_OVER,
      window.PUSH_DIALOG_QUEUE,
    ];
    var index;
    var hooked = false;

    function wrapOwnerMethod(owner, methodName) {
      var original;

      if (!owner || typeof owner[methodName] !== "function") {
        return false;
      }

      if (owner[methodName].__quickMergeRewardHooked) {
        return true;
      }

      original = owner[methodName];
      owner[methodName] = function () {
        var shouldBlock = shouldBlockRewardDialog(arguments);
        var dialogType = arguments[0];

        if (shouldBlock) {
          try {
            console.log(LOG_PREFIX, "reward dialog suppressed", methodName);
          } catch (err) {}
          return getSuppressedRewardDialogResult(methodName);
        }

        return original.apply(this, arguments);
      };
      owner[methodName].__quickMergeRewardHooked = true;

      try {
        console.log(LOG_PREFIX, methodName, "reward dialog hook installed");
      } catch (err) {}

      return true;
    }

    hooked = wrapOwnerMethod(window, "SHOW_DIALOG_DEFERRED") || hooked;
    hooked = wrapOwnerMethod(window, "SHOW_PROXY") || hooked;
    hooked = wrapOwnerMethod(window, "SHOW_PROXY_OVER") || hooked;
    hooked = wrapOwnerMethod(window, "PUSH_DIALOG_QUEUE") || hooked;

    if (false && typeof window.__require === "function") {
      [
        "UIManager",
        "ui/common/UIManager",
        "../common/UIManager",
        "./UIManager",
        "index-ui",
        "ui/index-ui",
        "../index-ui",
        "../../ui/index-ui",
        "../../../ui/index-ui",
      ].forEach(function (name) {
        var moduleValue;

        try {
          moduleValue = window.__require(name);
          hooked = wrapOwnerMethod(moduleValue, "SHOW_DIALOG_DEFERRED") || hooked;
          hooked = wrapOwnerMethod(moduleValue, "SHOW_PROXY") || hooked;
          hooked = wrapOwnerMethod(moduleValue, "SHOW_PROXY_OVER") || hooked;
          hooked = wrapOwnerMethod(moduleValue, "PUSH_DIALOG_QUEUE") || hooked;
        } catch (err) {}
      });
    }

    for (index = 0; index < candidates.length; index += 1) {
      if (typeof candidates[index] === "function") {
        hooked = true;
      }
    }

    return hooked;
  }

  function installRewardDialogHook() {
    var attempts = 0;
    var timer = setInterval(function () {
      attempts += 1;
      if (wrapRewardDialogsOnce() || attempts >= 300) {
        clearInterval(timer);
      }
    }, 200);
  }


  setTimeout(function() { installRewardDialogHook(); }, 8000);

  function getTileItemKey(tile) {
    if (!tile || !tile.canMerge) {
      return "";
    }

    if (tile.gridItemId === undefined || tile.gridItemId === null) {
      return "";
    }

    return String(tile.gridItemId);
  }

  function findManualMergePair(dataSource) {
    var firstIndexByItem = {};
    var tiles = dataSource && dataSource.tiles;
    var index;
    var key;
    var previousIndex;

    if (!tiles || typeof tiles.length !== "number") {
      return null;
    }

    for (index = 0; index < tiles.length; index += 1) {
      key = getTileItemKey(tiles[index]);
      if (!key) {
        continue;
      }

      previousIndex = firstIndexByItem[key];
      if (typeof previousIndex === "number") {
        return [previousIndex, index];
      }

      firstIndexByItem[key] = index;
    }

    return null;
  }

  function indexToPosition(dataSource, index) {
    var column;

    if (typeof dataSource.arrayIndexToPosition === "function") {
      return dataSource.arrayIndexToPosition(index);
    }

    column = Number(dataSource.column) || 0;
    if (!column) {
      return null;
    }

    return {
      gridX: (index % column) + 1,
      gridY: Math.floor(index / column) + 1,
    };
  }

  function findUsableTile(dataSource) {
    var tiles = dataSource && dataSource.tiles;
    var index;
    var pos;
    var state;

    if (
      !tiles ||
      typeof tiles.length !== "number" ||
      typeof dataSource.getEmissionState !== "function"
    ) {
      return null;
    }

    for (index = 0; index < tiles.length; index += 1) {
      if (!tiles[index]) {
        continue;
      }

      pos = indexToPosition(dataSource, index);
      if (!pos) {
        continue;
      }

      try {
        state = dataSource.getEmissionState(pos);
      } catch (err) {
        state = 0;
      }

      if (state === EMISSION_CAN_LAUNCH) {
        return { index: index, pos: pos, method: "sendLaunchItem", type: "key" };
      }
    }

    return null;
  }

  function runKeyBatch(dataSource, maxCount) {
    var usedInBatch = 0;

    function nextKey() {
      var action;

      if (usedInBatch >= maxCount) {
        return Promise.resolve(usedInBatch > 0);
      }

      action = findUsableTile(dataSource);
      if (
        !action ||
        typeof dataSource[action.method] !== "function"
      ) {
        return Promise.resolve(usedInBatch > 0);
      }

      usedInBatch += 1;

      try {
        console.log(LOG_PREFIX, "manual key batch", usedInBatch, action.pos);
      } catch (err) {}

      return Promise.resolve(dataSource[action.method](action.pos))
        .then(function (ok) {
          if (!ok) {
            usedInBatch -= 1;
            return usedInBatch > 0;
          }

          return wait(KEY_USE_DELAY).then(nextKey);
        })
        .catch(function (err2) {
          try {
            console.warn(LOG_PREFIX, "manual key batch failed", err2);
          } catch (logErr) {}
          usedInBatch -= 1;
          return usedInBatch > 0;
        });
    }

    return nextKey().then(function (ok) {
      return { ok: ok, count: usedInBatch };
    });
  }

  function getMapValue(map, key) {
    var value;

    if (!map) {
      return undefined;
    }

    if (typeof map.get === "function") {
      value = map.get(key);
      if (value !== undefined) {
        return value;
      }

      if (typeof key === "number") {
        return map.get(String(key));
      }

      return map.get(Number(key));
    }

    value = map[key];
    if (value !== undefined) {
      return value;
    }

    return map[String(key)];
  }

  function getConfigsModule() {
    var names = [
      "Configs",
      "config/Configs",
      "launcher/config/Configs",
      "../launcher/config/Configs",
      "../../launcher/config/Configs",
      "../../../launcher/config/Configs",
      "../../../../launcher/config/Configs",
    ];
    var index;
    var moduleValue;

    if (window.Configs) {
      return window.Configs;
    }

    for (index = 0; index < names.length; index += 1) {
      moduleValue = requireConfigModule(names[index]);
      if (moduleValue) {
        return moduleValue.default || moduleValue;
      }
    }

    return null;
  }

  function getActMergeProgressList() {
    var configs = getConfigsModule();
    var progressConf = configs && configs.ActMergeProgressConf;

    if (!progressConf) {
      return [];
    }

    if (Array.isArray(progressConf.list)) {
      return progressConf.list;
    }

    if (progressConf.config && typeof progressConf.config === "object") {
      return Object.keys(progressConf.config).map(function (id) {
        return progressConf.config[id];
      });
    }

    if (progressConf.data && typeof progressConf.data === "object") {
      return Object.keys(progressConf.data).map(function (id) {
        return progressConf.data[id];
      });
    }

    return [];
  }

  function collectClaimableMergeTasks(dataSource) {
    var result = [];
    var taskMap = dataSource && dataSource.taskMap;
    var claimMap = dataSource && dataSource.taskClaimMap;
    var progressList;

    if (!taskMap) {
      return result;
    }

    function maybePush(taskId, progress) {
      var id = Number(taskId);
      var claimed = getMapValue(claimMap, id);

      if (!id || Number(progress) <= 0 || Number(claimed) > 0) {
        return;
      }

      result.push(id);
    }

    progressList = getActMergeProgressList();
    if (progressList.length > 0) {
      progressList.forEach(function (conf) {
        var id;

        if (!conf || conf.actId !== ACT_ID_NUM) {
          return;
        }

        id = Number(conf.id);
        maybePush(id, getMapValue(taskMap, id));
      });

      if (result.length > 0) {
        return result;
      }
    }

    if (typeof taskMap.forEach === "function") {
      taskMap.forEach(function (progress, taskId) {
        maybePush(taskId, progress);
      });
    } else {
      Object.keys(taskMap).forEach(function (taskId) {
        maybePush(taskId, taskMap[taskId]);
      });
    }

    return result;
  }

  function claimAvailableRewards(dataSource) {
    var tasks;
    var taskId;

    if (!dataSource) {
      return Promise.resolve(false);
    }

    if (
      typeof dataSource.canClaimConsumeReward === "function" &&
      typeof dataSource.sendClaimCostProgressReward === "function"
    ) {
      try {
        if (dataSource.canClaimConsumeReward()) {
          console.log(LOG_PREFIX, "claim cost progress reward");
          return Promise.resolve(dataSource.sendClaimCostProgressReward()).then(function (ok) {
            return !!ok;
          });
        }
      } catch (err) {}
    }

    if (typeof dataSource.sendClaimMergeProgressReward !== "function") {
      return Promise.resolve(false);
    }

    tasks = collectClaimableMergeTasks(dataSource);
    if (tasks.length <= 0) {
      return Promise.resolve(false);
    }

    taskId = tasks[0];
    try {
      console.log(LOG_PREFIX, "claim merge progress reward", taskId);
    } catch (err2) {}

    return Promise.resolve(dataSource.sendClaimMergeProgressReward(taskId)).then(function (ok) {
      return !!ok;
    });
  }

  function runManualAutoMerge(dataSource) {
    var tileCount = (dataSource.tiles && dataSource.tiles.length) || 64;
    var limit = Math.max(1, Math.min(300, tileCount * 4));
    var count = 0;
    var useCount = 0;
    var merged = false;
    var used = false;
    var claimedReward = false;

    function canRunAction() {
      return (
        dataSource &&
        typeof dataSource.sendMergeItems === "function" &&
        count < limit
      );
    }

    function hasPendingAction() {
      return canRunAction() && !!(findManualMergePair(dataSource) || findUsableTile(dataSource));
    }

    function finish() {
      try {
        console.log(
          LOG_PREFIX,
          "manual auto merge done, merges",
          count - useCount,
          "uses",
          useCount
        );
      } catch (err) {}

      if (count >= limit) {
        try {
          console.warn(LOG_PREFIX, "manual auto merge reached action limit", limit);
        } catch (err2) {}
      }

      return Promise.resolve(merged || used || claimedReward);
    }

    function claimRewardsThenMaybeContinue() {
      return claimAvailableRewards(dataSource)
        .then(function (claimed) {
          if (!claimed) {
            return finish();
          }

          claimedReward = true;
          return wait(CLAIM_DELAY).then(function () {
            if (hasPendingAction()) {
              return consumeItemsAndMerge();
            }

            return claimRewardsThenMaybeContinue();
          });
        })
        .catch(function (err) {
          try {
            console.warn(LOG_PREFIX, "manual reward claim failed", err);
          } catch (logErr) {}
          return finish();
        });
    }

    function consumeItemsAndMerge() {
      var pair;
      var sourcePos;
      var targetPos;
      var action;

      if (!dataSource || typeof dataSource.sendMergeItems !== "function") {
        return finish();
      }

      if (count >= limit) {
        return claimRewardsThenMaybeContinue();
      }

      pair = findManualMergePair(dataSource);
      if (!pair) {
        action = findUsableTile(dataSource);
        if (action && count < limit) {
          return runKeyBatch(
            dataSource,
            Math.min(KEY_BATCH_SIZE, limit - count)
          )
            .then(function (result) {
              if (!result.ok) {
                try {
                  console.warn(LOG_PREFIX, "manual key stopped at", useCount);
                } catch (err2) {}
                return claimRewardsThenMaybeContinue();
              }

              count += result.count;
              useCount += result.count;
              used = true;

              return wait(ACTION_DELAY).then(consumeItemsAndMerge);
            })
            .catch(function (err3) {
              try {
                console.warn(LOG_PREFIX, "manual key failed", err3);
              } catch (logErr) {}
              return claimRewardsThenMaybeContinue();
            });
        }

        return claimRewardsThenMaybeContinue();
      }

      sourcePos = indexToPosition(dataSource, pair[0]);
      targetPos = indexToPosition(dataSource, pair[1]);
      if (!sourcePos || !targetPos) {
        return claimRewardsThenMaybeContinue();
      }

      count += 1;

      try {
        console.log(LOG_PREFIX, "manual merge", count, sourcePos, targetPos);
      } catch (err2) {}

      return Promise.resolve(dataSource.sendMergeItems(sourcePos, targetPos))
        .then(function (ok) {
          if (!ok) {
            try {
              console.warn(LOG_PREFIX, "manual merge stopped at", count);
            } catch (err) {}
            return claimRewardsThenMaybeContinue();
          }

          merged = true;
          return wait(ACTION_DELAY).then(consumeItemsAndMerge);
        })
        .catch(function (err3) {
          try {
            console.warn(LOG_PREFIX, "manual auto merge failed", err3);
          } catch (logErr) {}
          return claimRewardsThenMaybeContinue();
        });
    }

    setAutomationRunning(true);

    return consumeItemsAndMerge().then(
      function (value) {
        setAutomationRunning(false);
        return value;
      },
      function (err) {
        setAutomationRunning(false);
        throw err;
      }
    );
  }

  window.__xyzwQuickMergeManualAutoMerge = runManualAutoMerge;
  installAutoMergeMethodHook();

  function patchBoard(board) {
    if (!board || typeof board !== "object") {
      return false;
    }

    if (board.quickMergeCondition !== 0) {
      board.quickMergeCondition = 0;
      try {
        console.log(LOG_PREFIX, "act", ACT_ID, "quickMergeCondition -> 0");
      } catch (err) {}
    }

    return true;
  }

  function patchBoardTable(table) {
    if (!table || typeof table !== "object") {
      return false;
    }

    return patchBoard(table[ACT_ID]) || patchBoard(table[ACT_ID_NUM]);
  }

  function patchRawConfig(config) {
    if (!config || typeof config !== "object") {
      return false;
    }

    return patchBoardTable(config.ActMergeBoardConf);
  }

  function walkForConfig(value, seen, depth) {
    var key;

    if (!value || typeof value !== "object" || depth > 8) {
      return false;
    }

    if (seen.indexOf(value) !== -1) {
      return false;
    }
    seen.push(value);

    if (patchRawConfig(value)) {
      return true;
    }

    if (Array.isArray(value)) {
      for (key = 0; key < value.length; key += 1) {
        if (walkForConfig(value[key], seen, depth + 1)) {
          return true;
        }
      }
      return false;
    }

    for (key in value) {
      if (
        Object.prototype.hasOwnProperty.call(value, key) &&
        walkForConfig(value[key], seen, depth + 1)
      ) {
        return true;
      }
    }

    return false;
  }

  function patchParsedConfig(value) {
    try {
      return walkForConfig(value, [], 0);
    } catch (err) {
      try {
        console.warn(LOG_PREFIX, "config patch failed", err);
      } catch (logErr) {}
      return false;
    }
  }

  var originalJsonParse = JSON.parse;
  JSON.parse = function () {
    var text = arguments[0];
    var shouldPatch =
      typeof text === "string" &&
      (text.indexOf('"ActMergeBoardConf"') !== -1 ||
        text.indexOf('"quickMergeCondition"') !== -1);
    var result = originalJsonParse.apply(this, arguments);

    if (shouldPatch) {
      patchParsedConfig(result);
    }

    return result;
  };

  function patchConfigModule(configs) {
    var boardConf;
    var board;

    if (!configs || typeof configs !== "object") {
      return false;
    }

    if (patchRawConfig(configs)) {
      return true;
    }

    boardConf = configs.ActMergeBoardConf;
    if (!boardConf || typeof boardConf !== "object") {
      return false;
    }

    if (patchBoardTable(boardConf.config || boardConf.data || boardConf.map)) {
      return true;
    }

    try {
      if (typeof boardConf.getByActId === "function") {
        board = boardConf.getByActId(ACT_ID_NUM) || boardConf.getByActId(ACT_ID);
        if (patchBoard(board)) {
          return true;
        }
      }
    } catch (err) {}

    try {
      if (typeof boardConf.getById === "function") {
        board = boardConf.getById(ACT_ID_NUM) || boardConf.getById(ACT_ID);
        if (patchBoard(board)) {
          return true;
        }
      }
    } catch (err2) {}

    return false;
  }

  function requireConfigModule(name) {
    try {
    if (false && typeof window.__require === "function") {
        return window.__require(name);
      }
    } catch (err) {}

    return null;
  }

  function patchRuntimeConfigs() {
    var names = [
      "Configs",
      "config/Configs",
      "launcher/config/Configs",
      "../launcher/config/Configs",
      "../../launcher/config/Configs",
      "../../../launcher/config/Configs",
      "../../../../launcher/config/Configs",
    ];
    var index;
    var moduleValue;

    if (patchConfigModule(window.Configs)) {
      return true;
    }

    for (index = 0; index < names.length; index += 1) {
      moduleValue = requireConfigModule(names[index]);
      if (
        patchConfigModule(moduleValue) ||
        patchConfigModule(moduleValue && moduleValue.default)
      ) {
        return true;
      }
    }

    return false;
  }

  var attempts = 0;
  setTimeout(function() {
  var timer = setInterval(function () {
    attempts += 1;
    if (patchRuntimeConfigs() || attempts >= 300) {
      clearInterval(timer);
    }
  }, 200);
  }, 8000);

  try {
    console.log(LOG_PREFIX, "installed");
  } catch (err) {}
})();



// ===== 屏蔽拍脸弹窗广告 =====
(function(root, factory) {
    const api = factory(root || {});
    if (typeof module === 'object' && module.exports && typeof window === 'undefined') {
        module.exports = api;
    } else {
        api.bootstrap();
    }
})(typeof unsafeWindow !== 'undefined' ? unsafeWindow : (typeof window !== 'undefined' ? window : globalThis), function(uw) {
    'use strict';

    function getModule(name) {
        try {
            return uw.__require ? uw.__require(name) : null;
        } catch (error) {
            return null;
        }
    }

    function patchFirstFaceToPlayerManager() {
        const mod = getModule('FirstFaceToPlayerManager');
        const F = mod && (mod.FirstFaceToPlayerManager || (mod.default && mod.default.FirstFaceToPlayerManager));
        if (!F || !F.prototype || F.prototype.__faceNoop) return false;
        const proto = F.prototype;

        proto.setActive = function() {};

        proto.runFaceToPlayerLayers = function() {
            try { this._isInitialize = true; } catch (e) {}
            try {
                const q = this.runFaceByQuery ? this.runFaceByQuery() : undefined;
                if (q && typeof q.then === 'function') {
                    return q.then(function() {
                        console.log('[face] 已拦截启动拍脸弹窗广告');
                    });
                }
            } catch (e) {}
            console.log('[face] 已拦截启动拍脸弹窗广告');
            return Promise.resolve();
        };

        proto.__faceNoop = true;
        console.log('[face] FirstFaceToPlayerManager 拍脸弹窗已禁用');
        return true;
    }

    function bootstrap() {
        let tries = 0;
        const timer = setInterval(function() {
            tries++;
            if (patchFirstFaceToPlayerManager()) {
                console.log('[face] patch 就绪，停止轮询');
                clearInterval(timer);
            } else if (tries > 240) {
                console.log('[face] patch 轮询超时，FirstFaceToPlayerManager 未装上');
                clearInterval(timer);
            }
        }, 500);
    }

    return { bootstrap: bootstrap };
});

// ===== 更换头像 =====
!function () {
  if (!window.__xingchiAvatarHeadImgFixInstalled) {
    window.__xingchiAvatarHeadImgFixInstalled = true;
    var _0x1e2d63 = 0x0;
    var _0x491f2e = null;
    setTimeout(_0x93b550, 0x5dc);
    window.__avatarHeadImgFixRetry = _0x93b550;
  }
  function _0x23e77b() {
    try {
      Array.prototype.slice.call(arguments).unshift("[AvatarHeadImgFix]");
    } catch (_0x137248) {}
  }
  function _0x3777d3(_0x301091) {
    try {
      var _0x318cdb = "function" == typeof window.__require ? window.__require : null;
      return _0x318cdb ? _0x318cdb(_0x301091) : null;
    } catch (_0x73f9c4) {
      return null;
    }
  }
  function _0xa1ad() {
    var _0x97305a = _0x3777d3("PlatformManager");
    return _0x97305a && _0x97305a.PlatformManager && _0x97305a.PlatformManager.instance;
  }
  function _0x5473a6() {
    var _0x3bd892 = _0x3777d3("PlatformManager");
    if (!_0x491f2e && _0x3bd892 && "function" == typeof _0x3bd892.getClientVersion) {
      _0x491f2e = function () {
        return _0x3bd892.getClientVersion();
      };
    }
    var _0x4cc695 = _0xa1ad();
    if (_0x4cc695) {
      _0x4cc695.getClientVersion = function () {
        return Promise.resolve(function () {
          try {
            if (_0x491f2e) {
              var _0x22b9b4 = _0x491f2e();
              if (_0x22b9b4 && "function" == typeof _0x22b9b4.then) {
                return _0x22b9b4;
              }
              if (_0x22b9b4) {
                return String(_0x22b9b4);
              }
            }
          } catch (_0x37563f) {}
          var _0x3bdc73 = [window.GAME_VERSION, window.gameVersion, window.__GAME_VERSION__, window.__gameVersion];
          for (var _0x5165b6 = 0x0; _0x5165b6 < _0x3bdc73.length; _0x5165b6++) {
            if (_0x3bdc73[_0x5165b6]) {
              return String(_0x3bdc73[_0x5165b6]);
            }
          }
          return '0.32.0-android';
        }());
      };
    }
  }
  function _0x356d12(_0x1e32f6, _0x2efe89) {
    var _0x186c02 = document.createElement("canvas");
    _0x186c02.width = _0x2efe89;
    _0x186c02.height = _0x2efe89;
    var _0x10b3c3 = _0x186c02.getContext('2d');
    _0x10b3c3.fillStyle = '#fff';
    _0x10b3c3.fillRect(0x0, 0x0, _0x2efe89, _0x2efe89);
    var _0x5a6da0 = _0x1e32f6.naturalWidth || _0x1e32f6.width || 0x0;
    var _0x521871 = _0x1e32f6.naturalHeight || _0x1e32f6.height || 0x0;
    if (!_0x5a6da0 || !_0x521871) {
      throw new Error("invalid image size");
    }
    var _0xa1f27f = Math.min(_0x5a6da0, _0x521871);
    var _0x278511 = Math.max(0x0, (_0x5a6da0 - _0xa1f27f) / 0x2);
    var _0xe346b1 = Math.max(0x0, (_0x521871 - _0xa1f27f) / 0x2);
    _0x10b3c3.drawImage(_0x1e32f6, _0x278511, _0xe346b1, _0xa1f27f, _0xa1f27f, 0x0, 0x0, _0x2efe89, _0x2efe89);
    return _0x186c02.toDataURL('image/jpeg', 0.86).split(',')[0x1] || '';
  }
  function _0x432e4c(_0x2f813b, _0xf6d9e) {
    return function (_0xe4ef6) {
      return new Promise(function (_0x574d1a, _0xd5ad5c) {
        var _0x409cf4 = document.createElement('input');
        _0x409cf4.type = 'file';
        _0x409cf4.accept = "image/*";
        _0x409cf4.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0.01;z-index:2147483647;';
        document.body.appendChild(_0x409cf4);
        var _0x36d62b = false;
        function _0x31e0d6(_0x2834d8, _0x3d6236) {
          if (!_0x36d62b) {
            _0x36d62b = true;
            try {
              document.body.removeChild(_0x409cf4);
            } catch (_0x282747) {}
            _0x2834d8(_0x3d6236);
          }
        }
        _0x409cf4.addEventListener("change", function () {
          var _0x4d2fe8 = _0x409cf4.files && _0x409cf4.files[0x0];
          if (_0x4d2fe8) {
            _0x23e77b("picked file", _0x4d2fe8.name, _0x4d2fe8.type, _0x4d2fe8.size);
            var _0x477e65 = new FileReader();
            _0x477e65.onload = function () {
              var _0x559f9f = new Image();
              _0x559f9f.onload = function () {
                try {
                  var _0x3bf979 = _0xe4ef6 && _0xe4ef6[0x0] ? Number(_0xe4ef6[0x0]) : 0x200;
                  var _0x521d6a = _0xe4ef6 && _0xe4ef6[0x1] ? Number(_0xe4ef6[0x1]) : 0x62;
                  var _0x999d2a = [_0x356d12(_0x559f9f, _0x3bf979 || 0x200), _0x356d12(_0x559f9f, _0x521d6a || 0x62)];
                  if (!_0x999d2a[0x0] || !_0x999d2a[0x1]) {
                    return void _0x31e0d6(_0xd5ad5c, "empty base64");
                  }
                  _0x23e77b("encoded base64 lengths", _0x999d2a[0x0].length, _0x999d2a[0x1].length);
                  _0x31e0d6(_0x574d1a, {
                    'base64s': _0x999d2a
                  });
                } catch (_0x20b098) {
                  _0x31e0d6(_0xd5ad5c, _0x20b098 && _0x20b098.message ? _0x20b098.message : _0x20b098);
                }
              };
              _0x559f9f.onerror = function () {
                _0x31e0d6(_0xd5ad5c, "image decode fail");
              };
              _0x559f9f.src = _0x477e65.result;
            };
            _0x477e65.onerror = function () {
              _0x31e0d6(_0xd5ad5c, "filereader fail");
            };
            _0x477e65.readAsDataURL(_0x4d2fe8);
          } else {
            _0x31e0d6(_0xd5ad5c, "no file");
          }
        });
        try {
          _0x409cf4.click();
        } catch (_0x3fe99a) {
          _0x31e0d6(_0xd5ad5c, _0x3fe99a && _0x3fe99a.message ? _0x3fe99a.message : "click fail");
        }
      });
    }(_0xf6d9e).then(function (_0x5cf441) {
      var _0x559df2 = function (_0x596144) {
        if (!_0x596144) {
          return function () {};
        }
        try {
          Object.defineProperty(_0x596144, "isH5", {
            'configurable': true,
            'enumerable': true,
            'get': function () {
              return true;
            }
          });
        } catch (_0x2732b2) {}
        return function () {
          try {
            delete _0x596144.isH5;
          } catch (_0x445092) {
            try {
              Object.defineProperty(_0x596144, "isH5", {
                'configurable': true,
                'enumerable': true,
                'get': function () {
                  return 'h5' === window.PLATFORM || "h5web" === window.PLATFORM;
                }
              });
            } catch (_0x221a36) {}
          }
        };
      }(_0x2f813b);
      setTimeout(_0x559df2, 0x0);
      return _0x5cf441;
    });
  }
  function _0x93b550() {
    _0x1e2d63++;
    _0x5473a6();
    var _0x16c24f = function () {
      var _0x5c4b18 = _0x3777d3("PlayerInfoDialog");
      if (!_0x5c4b18) {
        return false;
      }
      var _0x768095 = false;
      ["PlayerInfoDialog", 'PlayerInfoTopDialog'].forEach(function (_0x3c239e) {
        var _0x67e3bd = _0x5c4b18[_0x3c239e] && _0x5c4b18[_0x3c239e].prototype;
        if (_0x67e3bd && "function" == typeof _0x67e3bd._isNeedUpgrade) {
          if (!_0x67e3bd._isNeedUpgrade.__xingchiAvatarPatched) {
            _0x67e3bd.__xingchiAvatarOriginalIsNeedUpgrade = _0x67e3bd._isNeedUpgrade;
            _0x67e3bd._isNeedUpgrade = function () {
              return false;
            };
            _0x67e3bd._isNeedUpgrade.__xingchiAvatarPatched = true;
          }
          _0x768095 = true;
        }
      });
      return _0x768095;
    }();
    var _0x4e8adb = function () {
      var _0x1ac698 = _0xa1ad();
      if (!_0x1ac698) {
        return false;
      }
      if (!(_0x1ac698.chooseImage && _0x1ac698.chooseImage.__xingchiAvatarPatched)) {
        _0x1ac698.chooseImage = function (_0x2deb48) {
          _0x23e77b('PlatformManager.chooseImage', _0x2deb48);
          return _0x432e4c(_0x1ac698, _0x2deb48)['catch'](function (_0x470c7e) {
            _0x23e77b("chooseImage failed", _0x470c7e);
            return null;
          });
        };
        _0x1ac698.chooseImage.__xingchiAvatarPatched = true;
      }
      if (!(_0x1ac698.readImgFile && _0x1ac698.readImgFile.__xingchiAvatarPatched)) {
        _0x1ac698.readImgFile = function () {
          return Promise.resolve('');
        };
        _0x1ac698.readImgFile.__xingchiAvatarPatched = true;
      }
      try {
        var _0x2f1da8 = _0x1ac698._platform;
        if (!(!_0x2f1da8 || _0x2f1da8.chooseImage && _0x2f1da8.chooseImage.__xingchiAvatarPatched)) {
          _0x2f1da8.chooseImage = function (_0xff0a99) {
            _0x23e77b("_platform.chooseImage", _0xff0a99);
            return _0x432e4c(_0x1ac698, _0xff0a99)["catch"](function () {
              return null;
            });
          };
          _0x2f1da8.chooseImage.__xingchiAvatarPatched = true;
        }
      } catch (_0x1e32e1) {}
      return true;
    }();
    var _0x52ad94 = function () {
      var _0x11ed1d = window.HSDK;
      if (!_0x11ed1d) {
        return false;
      }
      if (_0x11ed1d.chooseImage && _0x11ed1d.chooseImage.__xingchiAvatarPatched) {
        return true;
      }
      function _0x3015cc(_0xf96ae7, _0x88f3a6) {
        var _0x5b53f9 = "function" == typeof _0xf96ae7 ? _0xf96ae7 : null;
        var _0x1a5d8e = _0x5b53f9 ? _0x88f3a6 || {} : _0xf96ae7 || {};
        var _0x495f90 = _0x1a5d8e.imageSize || _0x1a5d8e.sizes || [0x200, 0x62];
        var _0x41bbed = _0x432e4c(_0xa1ad(), _0x495f90)['catch'](function () {
          return null;
        });
        if (!_0x5b53f9) {
          return _0x41bbed;
        }
        _0x41bbed.then(function (_0x519949) {
          try {
            _0x5b53f9(_0x519949);
          } catch (_0x265bb7) {}
        });
      }
      _0x11ed1d.chooseImage = _0x3015cc;
      _0x11ed1d.chooseImage.__xingchiAvatarPatched = true;
      _0x11ed1d.file = _0x11ed1d.file || {};
      _0x11ed1d.file.chooseImage = function (_0x2b8c7e) {
        return _0x3015cc(_0x2b8c7e);
      };
      _0x11ed1d.file.chooseImage.__xingchiAvatarPatched = true;
      _0x11ed1d.selectLocalImage = function () {
        return _0x3015cc({
          'imageSize': [0x200, 0x62]
        });
      };
      _0x11ed1d.selectLocalImage.__xingchiAvatarPatched = true;
      _0x23e77b("HSDK.chooseImage patched");
      return true;
    }();
    var _0xfb7d9d = function () {
      var _0x27688a = _0x3777d3("NewChangeHeadImgDialog");
      var _0x336f0e = _0x3777d3('ChangeHeadImgConfirmDialog');
      var _0xc1bc3c = _0x3777d3("index-ui");
      var _0x2c2a84 = _0x3777d3("TipsManager");
      var _0x38bc1f = _0x27688a && _0x27688a.NewChangeHeadImgDialog;
      if (!_0x38bc1f || !_0x38bc1f.prototype) {
        return false;
      }
      if (!_0x336f0e || !_0x336f0e.ChangeHeadImgConfirmDialog) {
        return false;
      }
      if (!_0xc1bc3c || "function" != typeof _0xc1bc3c.SHOW_PROXY) {
        return false;
      }
      if (_0x38bc1f.prototype.onShow && _0x38bc1f.prototype.onShow.__xingchiAvatarPatched) {
        return true;
      }
      var _0x29dcb5 = _0x336f0e.ChangeHeadImgConfirmDialog;
      var _0x5e9790 = _0xc1bc3c.SHOW_PROXY;
      var _0xaff99 = _0x2c2a84 && _0x2c2a84.SHOW_TIP;
      _0x38bc1f.prototype.onShow = function () {
        var _0x2c9f65 = this;
        var _0x538754 = this.ui;
        var _0xca01b8 = _0xa1ad();
        _0x2c9f65._showTip = false;
        try {
          _0x538754.m_btnCancel.clearClick();
        } catch (_0xfcd73c) {}
        try {
          _0x538754.m_btnConfirm.clearClick();
        } catch (_0x4b198d) {}
        _0x538754.m_btnCancel.onClick(function () {
          _0x2c9f65.close();
        });
        _0x538754.m_btnConfirm.onClick(function () {
          _0x23e77b("NewChangeHeadImgDialog confirm");
          if (!_0xca01b8 || 'function' != typeof _0xca01b8.chooseImage) {
            if (_0xaff99) {
              _0xaff99("图片获取失败");
            }
            return void _0x2c9f65.close();
          }
          var _0x9ee168 = _0xca01b8.chooseImage([0x200, 0x62]);
          _0x9ee168.then(function (_0x3f57c3) {
            _0x2c9f65.close();
            _0x23e77b("chooseImage result", _0x3f57c3 && {
              'hasBase64s': !!(_0x3f57c3 && _0x3f57c3.base64s && _0x3f57c3.base64s.length),
              'len0': _0x3f57c3 && _0x3f57c3.base64s && _0x3f57c3.base64s[0x0] && _0x3f57c3.base64s[0x0].length,
              'len1': _0x3f57c3 && _0x3f57c3.base64s && _0x3f57c3.base64s[0x1] && _0x3f57c3.base64s[0x1].length
            });
            var _0x1a970b = _0x3f57c3 && Array.isArray(_0x3f57c3.base64s) && _0x3f57c3.base64s.length ? _0x3f57c3.base64s.slice() : [];
            if (_0x1a970b.length > 0x0) {
              var _0x130879 = {
                [_0x29dcb5.BASE_64_DATA]: _0x1a970b
              };
              _0x5e9790(_0x29dcb5, _0x130879);
            } else if (_0xaff99) {
              _0xaff99("图片获取失败");
            }
          });
        });
      };
      _0x38bc1f.prototype.onShow.__xingchiAvatarPatched = true;
      _0x23e77b("NewChangeHeadImgDialog patched");
      return true;
    }();
    if (_0x16c24f && _0x4e8adb && _0xfb7d9d) {
      _0x23e77b("ready", {
        'attempts': _0x1e2d63,
        'hsdkReady': _0x52ad94
      });
      return void (_0x1e2d63 < 0xc8 && setTimeout(_0x93b550, 0x7d0));
    }
    if (_0x1e2d63 < 0xc8) {
      setTimeout(_0x93b550, 0x190);
    } else {
      _0x23e77b("partial ready", {
        'dialogReady': _0x16c24f,
        'pickerReady': _0x4e8adb,
        'headDialogReady': _0xfb7d9d,
        'hsdkReady': _0x52ad94
      });
    }
  }
}();

