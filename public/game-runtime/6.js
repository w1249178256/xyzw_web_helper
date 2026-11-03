/*
 * Salt field attack dialog stay-open patch.
 *
 * game.js binds the fight button inside AttackTroopsPage/DefenseTroopsPage and
 * calls HIDE_PROXY(LegionWarTroopsDialog) before sendStartBattle. Patching the
 * switch globally is unreliable because the page module may cache the original
 * CHECK_SWITCH reference. This plugin replaces only the fight-button handler.
 */
(function () {
  'use strict';

  var root = typeof window !== 'undefined' ? window :
    (typeof globalThis !== 'undefined' ? globalThis : this);
  var GLOBAL_KEY = 'SaltAttackDialogStayOpen';
  var VERSION = '20260727-salt-attack-dialog-2';
  var RETRY_DELAY = 300;
  var MAX_RETRIES = 120;
  var PAGE_COUNT = 2;
  var state = {
    timer: 0,
    retries: 0,
    destroyed: false,
    patches: [],
    warnedModuleMissing: false
  };

  if (root[GLOBAL_KEY] && typeof root[GLOBAL_KEY].destroy === 'function') {
    try { root[GLOBAL_KEY].destroy(); } catch (_) {}
  }

  function log() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift('[SaltAttackDialog]');
    if (root.console && typeof root.console.log === 'function') {
      root.console.log.apply(root.console, args);
    }
  }

  function warn() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift('[SaltAttackDialog]');
    if (root.console && typeof root.console.warn === 'function') {
      root.console.warn.apply(root.console, args);
    }
  }

  function gameRequire(name) {
    if (typeof root.__require !== 'function') return null;
    try { return root.__require(name); } catch (_) { return null; }
  }

  function getExport(moduleName, exportName) {
    var moduleValue = gameRequire(moduleName);
    if (!moduleValue) return null;
    if (moduleValue[exportName]) return moduleValue[exportName];
    if (moduleValue.default) {
      return moduleValue.default[exportName] || moduleValue.default;
    }
    return null;
  }

  function getServerTime() {
    var dateModule = gameRequire('DateUtil');
    var dateUtil = dateModule && (dateModule.default || dateModule);
    var serverTime = dateUtil && Number(dateUtil.serverTime);
    return isFinite(serverTime) && serverTime > 0 ? serverTime : Date.now();
  }

  function getLegionWarModule() {
    var moduleManager = gameRequire('ModuleManager');
    var configs = gameRequire('Configs');
    var getModule = moduleManager && (moduleManager.GET_MODULE ||
      (moduleManager.default && moduleManager.default.GET_MODULE));
    var moduleType = configs && (configs.ModuleType ||
      (configs.default && configs.default.ModuleType));
    if (typeof getModule !== 'function' || !moduleType) return null;
    try {
      return getModule(moduleType.LEGION_WAR);
    } catch (_) {
      return null;
    }
  }

  function reportAttack(moduleValue) {
    var mosquitoModule = gameRequire('MosquitoData');
    var mosquitoKey = mosquitoModule && (mosquitoModule.MosquitoKey ||
      (mosquitoModule.default && mosquitoModule.default.MosquitoKey));
    if (moduleValue.mosquitoData &&
        typeof moduleValue.mosquitoData.bites === 'function' &&
        mosquitoKey) {
      moduleValue.mosquitoData.bites(mosquitoKey.a_t);
    }
  }

  function bindFightButton(page, item, player, checkChallenge) {
    var button = item && item.m_btnFight;
    if (!button || typeof button.clearClick !== 'function' ||
        typeof button.onClick !== 'function' || !player) {
      return;
    }

    button.clearClick();
    button.onClick(function () {
      var legionWar = getLegionWarModule();
      if (!legionWar || typeof legionWar.sendStartBattle !== 'function') {
        if (!state.warnedModuleMissing) {
          state.warnedModuleMissing = true;
          warn('LEGION_WAR module is unavailable; fight request was not sent');
        }
        return;
      }

      var targetId = player.hasTeam && player.team ?
        player.team.leaderId : player.id;
      if (checkChallenge &&
          typeof legionWar.canStartChallengeTip2 === 'function' &&
          !legionWar.canStartChallengeTip2(targetId)) {
        return;
      }

      var now = getServerTime();
      if (now < (page._delayTime || 0)) return;
      page._delayTime = now + 100;

      if (legionWar.sendStartBattle(targetId)) {
        reportAttack(legionWar);
      }
      // Deliberately do not call HIDE_PROXY(LegionWarTroopsDialog).
    }, page);
  }

  function hasPatchFor(pageName) {
    for (var index = 0; index < state.patches.length; index++) {
      if (state.patches[index].pageName === pageName) return true;
    }
    return false;
  }

  function patchPage(pageName, checkChallenge) {
    if (hasPatchFor(pageName)) return true;

    var PageClass = getExport(pageName, pageName);
    var prototype = PageClass && PageClass.prototype;
    if (!prototype || typeof prototype._refreshItem !== 'function') {
      return false;
    }

    var original = prototype._refreshItem;
    if (original.__saltAttackDialogStayOpenVersion === VERSION) {
      state.patches.push({
        pageName: pageName,
        prototype: prototype,
        original: original.__saltAttackDialogStayOpenOriginal || original,
        wrapper: original
      });
      return true;
    }

    var wrapper = function (index, item, player) {
      var result = original.apply(this, arguments);
      bindFightButton(this, item, player, checkChallenge);
      return result;
    };
    wrapper.__saltAttackDialogStayOpenVersion = VERSION;
    wrapper.__saltAttackDialogStayOpenOriginal = original;
    prototype._refreshItem = wrapper;
    state.patches.push({
      pageName: pageName,
      prototype: prototype,
      original: original,
      wrapper: wrapper
    });
    return true;
  }

  function patch() {
    if (state.destroyed) return false;
    patchPage('AttackTroopsPage', true);
    patchPage('DefenseTroopsPage', false);
    return state.patches.length === PAGE_COUNT;
  }

  function retryPatch() {
    if (state.destroyed) return;
    if (patch()) {
      log('installed: the salt-field fight button now keeps the troop dialog open');
      return;
    }
    state.retries++;
    if (state.retries >= MAX_RETRIES) {
      warn('timed out while waiting for the salt-field troop pages');
      return;
    }
    state.timer = root.setTimeout(retryPatch, RETRY_DELAY);
  }

  function destroy() {
    state.destroyed = true;
    if (state.timer) {
      root.clearTimeout(state.timer);
      state.timer = 0;
    }
    for (var index = state.patches.length - 1; index >= 0; index--) {
      var patchInfo = state.patches[index];
      if (patchInfo.prototype._refreshItem === patchInfo.wrapper) {
        patchInfo.prototype._refreshItem = patchInfo.original;
      }
    }
    state.patches.length = 0;
    if (root[GLOBAL_KEY] && root[GLOBAL_KEY].destroy === destroy) {
      try { delete root[GLOBAL_KEY]; } catch (_) { root[GLOBAL_KEY] = null; }
    }
  }

  root[GLOBAL_KEY] = {
    version: VERSION,
    destroy: destroy,
    patch: patch,
    getState: function () {
      return {
        version: VERSION,
        patchedPages: state.patches.map(function (entry) {
          return entry.pageName;
        }),
        retries: state.retries
      };
    }
  };

  retryPatch();
}());
