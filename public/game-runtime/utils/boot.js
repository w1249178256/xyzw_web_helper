// 游戏启动函数
(function () {
    // 定义 loadDecodeJSC 函数（从 xxy 项目复制）
    var i = 2654435769;

    function o(e, t) {
        var i = e.length, o = i << 2;
        if (t) {
            var n = e[i - 1];
            if (n < (o -= 4) - 3 || n > o) return null;
            o = n
        }
        for (var a = new Uint8Array(o), r = 0; r < o; ++r) a[r] = e[r >> 2] >> ((3 & r) << 3);
        return a
    }

    function n(e, t) {
        var i, o = e.length, n = o >> 2;
        0 != (3 & o) && ++n, t ? (i = new Uint32Array(n + 1))[n] = o : i = new Uint32Array(n);
        for (var a = 0; a < o; ++a) i[a >> 2] |= e[a] << ((3 & a) << 3);
        return i
    }

    function a(e, t, i, o, n, a) {
        return (i >>> 5 ^ t << 2) + (t >>> 3 ^ i << 4) ^ (e ^ t) + (a[3 & o ^ n] ^ i)
    }

    function r(e) {
        if (e.length < 16) {
            var t = new Uint8Array(16);
            t.set(e), e = t
        }
        return e
    }

    function s(e, t) {
        var o, n, r, s, l, u, c = e.length, h = c - 1;
        for (n = e[h], r = 0, u = 0 | Math.floor(6 + 52 / c); u > 0; --u) {
            for (s = (r += i) >>> 2 & 3, l = 0; l < h; ++l) o = e[l + 1], n = e[l] += a(r, o, n, l, s, t);
            o = e[0], n = e[h] += a(r, o, n, l, s, t)
        }
        return e
    }

    function l(e, t) {
        var o, n, r, s, l, u = e.length, c = u - 1;
        for (o = e[0], r = Math.floor(6 + 52 / u) * i; 0 !== r; r -= i) {
            for (s = r >>> 2 & 3, l = c; l > 0; --l) n = e[l - 1], o = e[l] -= a(r, o, n, l, s, t);
            n = e[c], o = e[0] -= a(r, o, n, l, s, t)
        }
        return e
    }

    function u(e) {
        for (var t = e.length, i = new Uint8Array(3 * t), o = 0, n = 0; n < t; n++) {
            var a = e.charCodeAt(n);
            if (a < 128) i[o++] = a;
            else if (a < 2048) i[o++] = 192 | a >> 6, i[o++] = 128 | 63 & a;
            else if (a < 55296 || a >= 57344) i[o++] = 224 | a >> 12, i[o++] = 128 | 63 & a >> 6, i[o++] = 128 | 63 & a;
            else {
                a = 65536 + ((1023 & a) << 10 | 1023 & e.charCodeAt(++n));
                i[o++] = 240 | a >> 18, i[o++] = 128 | 63 & a >> 12, i[o++] = 128 | 63 & a >> 6, i[o++] = 128 | 63 & a
            }
        }
        return i.slice(0, o)
    }

    function c(e, t) {
        for (var i = new Uint16Array(t), o = 0, n = 0, a = e.length; o < t && n < a; o++) {
            var r = e[n++];
            switch (r >> 4) {
                case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
                    i[o] = r;
                    break;
                case 12: case 13:
                    if (!(n < a)) throw new Error("Unfinished UTF-8 octet sequence");
                    i[o] = (31 & r) << 6 | 63 & e[n++];
                    break;
                case 14:
                    if (!(n + 1 < a)) throw new Error("Unfinished UTF-8 octet sequence");
                    i[o] = (15 & r) << 12 | (63 & e[n++]) << 6 | 63 & e[n++];
                    break;
                case 15:
                    if (!(n + 2 < a)) throw new Error("Unfinished UTF-8 octet sequence");
                    var s = ((7 & r) << 18 | (63 & e[n++]) << 12 | (63 & e[n++]) << 6 | 63 & e[n++]) - 65536;
                    if (!(0 <= s && s <= 1048575)) throw new Error("Character outside valid Unicode range: 0x" + s.toString(16));
                    i[o++] = s >> 10 & 1023 | 55296, i[o] = 1023 & s | 56320;
                    break;
                default:
                    throw new Error("Bad UTF-8 encoding 0x" + r.toString(16))
            }
        }
        return o < t && (i = i.subarray(0, o)), String.fromCharCode.apply(String, i)
    }

    function h(e, t) {
        for (var i = [], o = new Uint16Array(32768), n = 0, a = 0, r = e.length; n < t && a < r; n++) {
            var s = e[a++];
            switch (s >> 4) {
                case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
                    o[n] = s;
                    break;
                case 12: case 13:
                    if (!(a < r)) throw new Error("Unfinished UTF-8 octet sequence");
                    o[n] = (31 & s) << 6 | 63 & e[a++];
                    break;
                case 14:
                    if (!(a + 1 < r)) throw new Error("Unfinished UTF-8 octet sequence");
                    o[n] = (15 & s) << 12 | (63 & e[a++]) << 6 | 63 & e[a++];
                    break;
                case 15:
                    if (!(a + 2 < r)) throw new Error("Unfinished UTF-8 octet sequence");
                    var l = ((7 & s) << 18 | (63 & e[a++]) << 12 | (63 & e[a++]) << 6 | 63 & e[a++]) - 65536;
                    if (!(0 <= l && l <= 1048575)) throw new Error("Character outside valid Unicode range: 0x" + l.toString(16));
                    o[n++] = l >> 10 & 1023 | 55296, o[n] = 1023 & l | 56320;
                    break;
                default:
                    throw new Error("Bad UTF-8 encoding 0x" + s.toString(16))
            }
            if (n >= 32766) {
                var u = n + 1;
                i.push(String.fromCharCode.apply(String, o.subarray(0, u))), t -= u, n = -1
            }
        }
        return n > 0 && i.push(String.fromCharCode.apply(String, o.subarray(0, n))), i.join("")
    }

    function _(e) {
        var t = e.length;
        return 0 === t ? "" : t < 32767 ? c(e, t) : h(e, t)
    }

    function decrypt(t, i) {
        if ("string" == typeof t) {
            try {
                t = new Uint8Array(atob(t).split("").map(function (e) { return e.charCodeAt(0); }));
            } catch (e) {
                return new Uint8Array(0);
            }
        }
        if ("string" == typeof i) i = u(i);
        if (null == t || 0 === t.length) return new Uint8Array(0);
        return o(l(n(t, !1), n(r(i), !1)), !0)
    }

    function decryptToString(t, i) {
        var decrypted = decrypt(new Uint8Array(t), i);
        return new TextDecoder('utf-8').decode(decrypted);
    }

    // 定义 window.loadDecodeJSC 函数
    window.loadDecodeJSC = function (resp) {
        let content = decryptToString(resp, "0Aed5E79bbEa69f8");
        content = content.replace('isNativeAPP(){return!', 'sNativeAPP(){return');
        // 删除 launcher 中禁用 loadAny 的代码
        content = content.replace(/cc\.assetManager\.loadAny\s*=\s*function\s*\([^)]*\)\s*\{\s*\},?/g, '');
        // 删除 game 中禁用 loadBundle 的代码 (isH5 判断)
        content = content.replace(/[a-zA-Z_$][a-zA-Z0-9_$]*\.PlatformManager\.instance\.isH5\s*&&\s*\(\s*cc\.assetManager\.loadBundle\s*=\s*function\s*\([^)]*\)\s*\{\s*\}\s*\),?/g, '');
        // 额外处理：直接删除任何将 loadBundle 置空的代码
        content = content.replace(/cc\.assetManager\.loadBundle\s*=\s*function\s*\([^)]*\)\s*\{\s*\}/g, 'void 0');
        const script = document.createElement('script');
        script.textContent = content;
        script.type = 'text/javascript';
        document.body.appendChild(script);
    };
    function getManifest(url, options, onProgress, onComplete) {
        var xhr = new XMLHttpRequest(), errInfo = 'download failed: ' + url + ', status: ';
        xhr.open('POST', url, true);
        if (options.responseType !== undefined) xhr.responseType = options.responseType;
        if (options.withCredentials !== undefined) xhr.withCredentials = options.withCredentials;
        if (options.mimeType !== undefined && xhr.overrideMimeType) xhr.overrideMimeType(options.mimeType);
        if (options.timeout !== undefined) xhr.timeout = options.timeout;
        if (options.header) {
            for (var header in options.header) {
                xhr.setRequestHeader(header, options.header[header]);
            }
        }
        xhr.onload = function () {
            if (xhr.status === 200 || xhr.status === 0) {
                onComplete && onComplete(null, xhr.response);
            } else {
                onComplete && onComplete(new Error(errInfo + xhr.status + '(no response)'));
            }
        };

        if (onProgress) {
            xhr.onprogress = function (e) {
                if (e.lengthComputable) {
                    onProgress(e.loaded, e.total);
                }
            };
        }

        xhr.onerror = function () {
            onComplete && onComplete(new Error(errInfo + xhr.status + '(error)'));
        };

        xhr.ontimeout = function () {
            onComplete && onComplete(new Error(errInfo + xhr.status + '(time out)'));
        };

        xhr.onabort = function () {
            onComplete && onComplete(new Error(errInfo + xhr.status + '(abort)'));
        };

        xhr.send(null);

        return xhr;
    }

    window.boot = function () {
        var settings = window._CCSettings;
        window._CCSettings = undefined;
        var onProgress = null;
        const cc = window.cc;
        var RESOURCES = cc.AssetManager.BuiltinBundleName.RESOURCES;
        var INTERNAL = cc.AssetManager.BuiltinBundleName.INTERNAL;
        var MAIN = cc.AssetManager.BuiltinBundleName.MAIN;

        function setLoadingDisplay() {
            var splash = document.getElementById('splash');
            var progressBar = splash ? splash.querySelector('.progress-bar span') : null;
            onProgress = function (finish, total) {
                var percent = 100 * finish / total;
                if (progressBar) {
                    progressBar.style.width = percent.toFixed(2) + '%';
                }
            };
            if (splash) {
                splash.style.display = 'block';
                if (progressBar) {
                    progressBar.style.width = '0%';
                }
            }

            cc.director.once(cc.Director.EVENT_AFTER_SCENE_LAUNCH, function () {
                if (splash) {
                    splash.style.display = 'none';
                }
            });
        }

        var onStart = function () {
            cc.view.enableRetina(true);
            cc.view.resizeWithBrowserSize(true);

            if (cc.sys.isBrowser) {
                setLoadingDisplay();
            }

            if (cc.sys.isMobile) {
                if (settings.orientation === 'landscape') {
                    cc.view.setOrientation(cc.macro.ORIENTATION_LANDSCAPE);
                } else if (settings.orientation === 'portrait') {
                    cc.view.setOrientation(cc.macro.ORIENTATION_PORTRAIT);
                }
                cc.view.enableAutoFullScreen([
                    cc.sys.BROWSER_TYPE_BAIDU,
                    cc.sys.BROWSER_TYPE_BAIDU_APP,
                    cc.sys.BROWSER_TYPE_WECHAT,
                    cc.sys.BROWSER_TYPE_MOBILE_QQ,
                    cc.sys.BROWSER_TYPE_MIUI,
                    cc.sys.BROWSER_TYPE_HUAWEI,
                    cc.sys.BROWSER_TYPE_UC,
                ].indexOf(cc.sys.browserType) < 0);
            }

            if (cc.sys.isBrowser && cc.sys.os === cc.sys.OS_ANDROID) {
                cc.assetManager.downloader.maxConcurrency = 2;
                cc.assetManager.downloader.maxRequestsPerFrame = 2;
            }

            var launchScene = settings.launchScene;
            var bundle = cc.assetManager.bundles.find(function (b) {
                return b.getSceneInfo(launchScene);
            });

            bundle.loadScene(launchScene, null, onProgress,
                function (err, scene) {
                    if (!err) {
                        cc.director.runSceneImmediate(scene);
                        if (cc.sys.isBrowser) {
                            var canvas = document.getElementById('GameCanvas');
                            if (canvas) {
                                canvas.style.visibility = '';
                            }
                            var div = document.getElementById('GameDiv');
                            if (div) {
                                div.style.backgroundImage = '';
                            }
                            console.log('Success to load scene: ' + launchScene);
                        }
                    } else {
                        console.error('Failed to load scene:', err);
                    }
                }
            );
        };

        var option = {
            id: 'GameCanvas',
            debugMode: settings.debug ? cc.debug.DebugMode.INFO : cc.debug.DebugMode.ERROR,
            showFPS: settings.debug,
            frameRate: 60,
            groupList: settings.groupList,
            collisionMatrix: settings.collisionMatrix,
        };

        var bundleRoot = [INTERNAL];
        settings.hasResourcesBundle && bundleRoot.push(RESOURCES);

        var count = 0;

        function cb(err) {
            if (err) {
                console.error(err.message, err.stack);
                return;
            }
            count++;
            if (count === bundleRoot.length + 1) {
                cc.assetManager.loadBundle(MAIN, function (err) {
                    if (!err) {
                        cc.game.run(option, onStart);
                    } else {
                        console.error('Failed to load MAIN bundle:', err);
                    }
                });
            }
        }

        var download_func = null;
        var retryTotal = 60;
        var retryCount = 0;
        download_func = function () {
            var server = window.SERVER || settings.server || 'https://xxz-xyzw-res.hortorgames.com';
            var manifestVersion = window.MANIFEST_CLIENT_VERSION || '0.1.0-androidh5';
            getManifest(server + '/login/manifest?platform=hortor&version=' + encodeURIComponent(manifestVersion), {
                responseType: 'json',
                header: {
                    'Content-Type': 'application/json;charset=UTF-8',
                    'Accept': 'application/json, text/plain, */*',
                }
            }, null, (err, result) => {
                if (err) {
                    cc.sys.manifestResult = {
                        code: -1,
                        error: err,
                    };
                    console.error("mainjs error download_func", err.message);
                    console.error("mainjs error retryCount is", retryCount);
                    if (++retryCount < retryTotal) {
                        setTimeout(download_func, 1000);
                    } else {
                        console.error("Failed to download manifest after " + retryTotal + " retries");
                    }
                } else {
                    const bundleVersStr = result && result.body && result.body.bundleVers;
                    const bundleVers = typeof bundleVersStr === 'string' ? JSON.parse(bundleVersStr) : bundleVersStr;
                    result.body.bundleVers = bundleVers;
                    let manifestResult = {
                        code: 0,
                        error: null,
                        rawData: result.body
                    };
                    cc.sys.manifestResult = manifestResult;
                    for (let bundleName in bundleVers) {
                        if (bundleName === "COMMIT_ID") {
                            continue;
                        }
                        settings.bundleVers[bundleName] = bundleVers[bundleName];
                        if (bundleName !== "codeVersion" && settings.remoteBundles.indexOf(bundleName) === -1) {
                            settings.remoteBundles.push(bundleName);
                        }
                    }
                    window.ccInternalRemoteBundles = new Set(settings.remoteBundles);
                    cc.assetManager.init({
                        bundleVers: settings.bundleVers,
                        remoteBundles: settings.remoteBundles,
                        server: settings.server
                    });
                    for (var i = 0; i < bundleRoot.length; i++) {
                        cc.assetManager.loadBundle(bundleRoot[i], cb);
                    }
                    cc.assetManager.loadScript(settings.jsList.map(function (x) {
                        return 'src/' + x;
                    }), cb);
                }
            });
        };
        download_func();
    };
})();

