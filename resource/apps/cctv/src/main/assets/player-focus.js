(function () {
    'use strict';

    // The official desktop live page creates #player > video#h5player_player.
    // Keep that tree in place: moving its video breaks the website's own player.
    var VERSION = 1;
    var KEY = '__puretvCctvFocus';
    var PATH = 'data-puretv-cctv-path';
    var ROOT = 'data-puretv-cctv-root';
    var FILL = 'data-puretv-cctv-fill';
    var HIDDEN = 'data-puretv-cctv-hidden';
    var MAX_DOCUMENTS = 8;
    var MAX_FRAMES = 16;
    var MAX_DEPTH = 4;
    var WATCH_MS = 45000;
    var previous = window[KEY];
    if (previous && previous.version === VERSION && !previous.disposed) return previous.refresh();
    if (previous && typeof previous.dispose === 'function') previous.dispose();

    var documents = [];
    var frames = [];
    var attempted = [];
    var pending = null;
    var deadline = Date.now() + WATCH_MS;
    var stopped = false;
    var generation = 0;
    var frameBudget = 0;
    var css = 'html,body{width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;margin:0!important;padding:0!important;background:#000!important;overflow:hidden!important;overscroll-behavior:none!important;}' +
        '[' + HIDDEN + ']{display:none!important;}' +
        '[' + PATH + ']{display:block!important;box-sizing:border-box!important;position:relative!important;float:none!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;max-width:none!important;max-height:none!important;margin:0!important;padding:0!important;border:0!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;transform:none!important;overflow:hidden!important;overscroll-behavior:none!important;}' +
        '[' + FILL + ']{box-sizing:border-box!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;margin:0!important;padding:0!important;border:0!important;}' +
        '[' + ROOT + ']{background-color:#000!important;}' +
        '[' + ROOT + '] video,video[' + ROOT + '],[' + ROOT + '] iframe,iframe[' + ROOT + ']{width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;border:0!important;object-fit:contain!important;}' +
        '::-webkit-scrollbar{display:none!important;width:0!important;height:0!important;}';

    function mark(record, node, attribute) {
        if (!node || node.nodeType !== 1) return;
        if (!node.hasAttribute(attribute)) {
            node.setAttribute(attribute, '');
            record.marked.push([node, attribute]);
        }
    }

    function schedule() {
        if (stopped || pending !== null) return;
        pending = window.setTimeout(function () { pending = null; refresh(); }, 120);
    }

    function recordFor(doc) {
        for (var i = 0; i < documents.length; i++) {
            if (documents[i].doc === doc) {
                documents[i].seen = generation;
                clearMarks(documents[i]);
                return documents[i];
            }
        }
        if (documents.length >= MAX_DOCUMENTS || !doc.documentElement) return null;
        var record = { doc: doc, observer: null, style: null, marked: [], seen: generation };
        var style = doc.createElement('style');
        style.setAttribute('data-puretv-cctv-style', '');
        style.textContent = css;
        (doc.head || doc.documentElement).appendChild(style);
        record.style = style;
        documents.push(record);
        var view = doc.defaultView;
        if (Date.now() < deadline && view && view.MutationObserver && doc.body) {
            record.observer = new view.MutationObserver(schedule);
            // Attribute changes include clocks, progress and our own styling; ignore them.
            record.observer.observe(doc.body, { childList: true, subtree: true });
        }
        return record;
    }

    function clearMarks(record) {
        for (var i = 0; i < record.marked.length; i++) record.marked[i][0].removeAttribute(record.marked[i][1]);
        record.marked = [];
    }

    function cleanRecord(record) {
        if (record.observer) record.observer.disconnect();
        clearMarks(record);
        if (record.style && record.style.parentNode) record.style.parentNode.removeChild(record.style);
    }

    function watchFrame(frame) {
        for (var i = 0; i < frames.length; i++) {
            if (frames[i].node === frame) { frames[i].seen = generation; return; }
        }
        if (frames.length >= MAX_FRAMES) return;
        frame.addEventListener('load', schedule);
        frames.push({ node: frame, seen: generation });
    }

    function chooseRoot(doc, insideFrame) {
        var official = doc.getElementById('player');
        if (official) return official;
        var video = doc.getElementById('h5player_player') || doc.querySelector('video');
        if (video) {
            var parent = video.parentElement;
            return parent && parent !== doc.body && parent !== doc.documentElement ? parent : video;
        }
        // Only descend into generic iframe documents after their host was found inside
        // a recognized player. Never choose the page's promotional iframe as a player.
        if (insideFrame) {
            var nested = doc.querySelector('iframe');
            if (nested) return nested;
        }
        return null;
    }

    function focusRoot(record, root) {
        mark(record, root, ROOT);
        var node = root;
        while (node && node !== record.doc.documentElement) {
            // Do not force a video to display: the official player may hide it to show
            // a rights/network error. Its message and controls remain inside #player.
            if (node.tagName !== 'VIDEO') mark(record, node, PATH);
            var parent = node.parentElement;
            if (!parent) break;
            for (var i = 0; i < parent.children.length; i++) {
                var sibling = parent.children[i];
                if (sibling !== node && sibling.tagName !== 'HEAD' && sibling !== record.style) mark(record, sibling, HIDDEN);
            }
            node = parent;
        }
    }

    function fillInnerPath(record, node, root) {
        var current = node.tagName === 'VIDEO' ? node.parentElement : node;
        while (current && current !== root) {
            mark(record, current, FILL);
            current = current.parentElement;
        }
    }

    function prepareVideo(video) {
        // Native controls remain available when the official controls need a pointer.
        video.controls = true;
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        if (attempted.indexOf(video) !== -1) return;
        attempted.push(video);
        // One attempt per element, never a repeated play loop overriding user pause.
        try {
            var result = video.play();
            if (result && typeof result.catch === 'function') result.catch(function () {});
        } catch (ignored) {}
    }

    function visit(doc, depth, insideFrame, state) {
        if (!doc || depth > MAX_DEPTH) return false;
        var record = recordFor(doc);
        if (!record) return false;
        var root = chooseRoot(doc, insideFrame);
        if (!root) return false;
        focusRoot(record, root);
        state.found = true;
        var videos = root.tagName === 'VIDEO' ? [root] : root.querySelectorAll('video');
        for (var i = 0; i < videos.length && i < 8; i++) {
            var video = videos[i];
            fillInnerPath(record, video, root);
            prepareVideo(video);
            if (!video.paused && !video.ended && !video.error && video.readyState >= 2) state.playing = true;
        }
        var children = root.tagName === 'IFRAME' ? [root] : root.querySelectorAll('iframe');
        for (var j = 0; j < children.length && frameBudget < MAX_FRAMES; j++) {
            var frame = children[j];
            frameBudget++;
            fillInnerPath(record, frame, root);
            watchFrame(frame);
            // Access naturally fails for a cross-origin iframe. Keep its original
            // host in place, without attempting navigation or same-origin workarounds.
            try {
                var nestedDoc = frame.contentDocument;
                if (nestedDoc) visit(nestedDoc, depth + 1, true, state);
            } catch (ignored) {}
        }
        return true;
    }

    function refresh() {
        if (stopped) return { found: false, playing: false, title: document.title || '' };
        generation++;
        frameBudget = 0;
        var state = { found: false, playing: false, title: document.title || '' };
        visit(document, 0, false, state);
        for (var i = documents.length - 1; i >= 0; i--) {
            if (documents[i].seen !== generation) { cleanRecord(documents[i]); documents.splice(i, 1); }
        }
        for (var j = frames.length - 1; j >= 0; j--) {
            if (frames[j].seen !== generation) {
                frames[j].node.removeEventListener('load', schedule);
                frames.splice(j, 1);
            }
        }
        // Bound references even if the official player replaces its video repeatedly.
        attempted = attempted.filter(function (video) {
            return documents.some(function (record) { return record.doc.documentElement.contains(video); });
        });
        return state;
    }

    function stopWatching() {
        for (var i = 0; i < documents.length; i++) if (documents[i].observer) documents[i].observer.disconnect();
    }

    var expiry = window.setTimeout(stopWatching, WATCH_MS);
    function dispose() {
        if (stopped) return;
        stopped = true;
        api.disposed = true;
        window.clearTimeout(expiry);
        if (pending !== null) window.clearTimeout(pending);
        pending = null;
        stopWatching();
        for (var i = 0; i < documents.length; i++) cleanRecord(documents[i]);
        for (var j = 0; j < frames.length; j++) frames[j].node.removeEventListener('load', schedule);
        documents = [];
        frames = [];
        attempted = [];
        window.removeEventListener('pagehide', dispose);
    }

    var api = { version: VERSION, disposed: false, refresh: refresh, dispose: dispose };
    window[KEY] = api;
    window.addEventListener('pagehide', dispose);
    return refresh();
}());
