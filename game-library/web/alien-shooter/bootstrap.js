/* Parse-safe startup errors remain visible beside the independent room sidebar. */
(function (root) {
  "use strict";
  var failed = false;
  function fail(error) {
    if (failed) return;
    failed = true;
    var english = false;
    try {
      english = root.AlienShooterHost ? JSON.parse(root.AlienShooterHost.getInfo()).language.indexOf("en") === 0
        : /(?:^|[?&])lang=en(?:&|$)/.test(root.location.search);
    } catch (_) {}
    var panel = document.getElementById("game-loading");
    panel.hidden = false;
    panel.setAttribute("data-failed", "true");
    panel.setAttribute("role", "alert");
    document.getElementById("loading-title").textContent = english
      ? "Game could not start"
      : "游戏启动失败";
    var detail = String((error && error.message) || error || "Unknown error");
    panel.setAttribute("data-error", detail);
    if (!english && !/[\u3400-\u9fff]/.test(detail)) {
      var labels = [
        ["WebGL is unavailable", "无法启动 WebGL 图形，请更新设备的浏览器或系统 WebView。"],
        ["Bundled baked material metadata is unavailable", "找不到游戏材质数据。"],
        ["Invalid bundled baked texture path", "游戏贴图路径无效。"],
        ["Timed out loading baked texture: ", "载入贴图超时："],
        ["Empty baked texture: ", "游戏贴图为空："],
        ["Could not decode baked texture: ", "无法读取贴图："],
        ["Could not load baked texture: ", "无法载入贴图："],
        ["Baked texture could not be loaded: ", "无法载入贴图："],
        ["Could not load ", "无法载入脚本："]
      ];
      var source = detail;
      detail = "请重新打开游戏。如果仍无法启动，请检查安装包是否完整。";
      for (var i = 0; i < labels.length; i++) {
        if (source.indexOf(labels[i][0]) === 0) {
          detail = labels[i][1] + source.slice(labels[i][0].length);
          break;
        }
      }
    }
    document.getElementById("loading-detail").textContent = detail;
  }
  root.AlienShooterStartup = { fail: fail };
  root.addEventListener(
    "error",
    function (event) {
      if (event.target && event.target.tagName === "SCRIPT")
        fail("Could not load " + event.target.getAttribute("src"));
      else if (event.message) fail(event.error || event.message);
    },
    true,
  );
  root.addEventListener("unhandledrejection", function (event) {
    fail(event.reason);
  });
})(window);
