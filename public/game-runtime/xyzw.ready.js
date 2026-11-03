; (function () {
    function ready() {
        if (typeof window.__require !== 'function') return false
        try {
            var C = window.__require('Configs');
            if (!C || !C.HorseConstant || !C.HorseConstant.config) return false;
        } catch (e) {
            return false
        }
        try {
            const director = cc && cc.director;
            const sched = director && director.getScheduler ? director.getScheduler() : null;
            if (sched && typeof sched.setTimeScale === 'function') {
                return true
            }
        } catch (e) {
            return false
        }
        return false
    }
    function whenReady(fn) {
        if (ready()) {
            console.log('[ReadyWrap] ready')
            try { fn() } catch (e) { console.error('[ReadyWrap] fn error', e) }
            return
        }
        console.log('[ReadyWrap] wait start')
        var tries = 0
        var t = setInterval(function () {
            if (ready()) {
                clearInterval(t)
                console.log('[ReadyWrap] ready after ' + tries)
                try { fn() } catch (e) { console.error('[ReadyWrap] fn error', e) }
            } else {
                tries++
                if (tries % 10 === 0) console.log('[ReadyWrap] waiting ' + tries)
                if (tries > 150) {
                    clearInterval(t)
                    console.warn('[ReadyWrap] timeout ' + tries)
                }
            }
        }, 200)
    }
    window.__whenGameReady = whenReady
})();
