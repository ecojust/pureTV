/* Decode bundled baked textures before creating the renderer. No network assets. */
(function (root) {
  "use strict";
  var pending = null;
  var loader = { status: "idle", load: load };
  function load() {
    if (pending) return pending;
    loader.status = "loading";
    pending = Promise.resolve().then(function () {
      var baked = root.AlienShooterBaked;
      if (!baked || baked.version !== 1 || !baked.atlas || !Array.isArray(baked.stages)) throw new Error("Bundled baked material metadata is unavailable");
      var paths = [baked.atlas.url];
      baked.stages.forEach(function (stage) { paths.push(stage.floor, stage.light); });
      paths = paths.filter(function (path, index) { return paths.indexOf(path) === index; });
      if (!paths.length || paths.length > 16 || paths.some(function (path) { return typeof path !== "string" || !/^baked-[a-z0-9-]+\.png$/.test(path); })) throw new Error("Invalid bundled baked texture path");
      var images = Object.create(null);
      return Promise.all(paths.map(function (path) {
        return new Promise(function (resolve, reject) {
          var image = new Image(), finished = false;
          var timeout = root.setTimeout(function () { finish(new Error("Timed out loading baked texture: " + path)); }, 20000);
          function finish(error) {
            if (finished) return;
            finished = true; root.clearTimeout(timeout); image.onload = null; image.onerror = null;
            if (error) reject(error);
            else { images[path] = image; resolve(); }
          }
          image.onload = function () {
            if (!image.naturalWidth || !image.naturalHeight) { finish(new Error("Empty baked texture: " + path)); return; }
            if (image.decode) image.decode().then(function () { finish(); }, function () { finish(new Error("Could not decode baked texture: " + path)); });
            else finish(); // Android WebView versions without Image.decode still decode at load.
          };
          image.onerror = function () { finish(new Error("Could not load baked texture: " + path)); };
          image.src = path;
        });
      })).then(function () { baked.images = images; loader.status = "ready"; return baked; });
    }).catch(function (error) { loader.status = "failed"; throw error; });
    return pending;
  }
  root.AlienShooterBakedLoader = loader;
})(window);
