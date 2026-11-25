/* Keep startup diagnostics readable even when another script cannot be parsed. */
(function (root) {
  "use strict";
  var failed = false;
  function fail(error) {
    if (failed) return;
    failed = true;
    var english = false;
    try {
      english = root.JackalHost ? JSON.parse(root.JackalHost.getInfo()).language.indexOf("en") === 0
        : /(?:^|[?&])lang=en(?:&|$)/.test(root.location.search);
    } catch (_) {}
    var panel = document.getElementById("game-loading");
    panel.hidden = false;
    panel.setAttribute("data-failed", "true");
    panel.setAttribute("role", "alert");
    document.getElementById("loading-title").textContent = english
      ? "Game could not start" : "游戏启动失败";
    var detail = String((error && error.message) || error || "Unknown error");
    panel.setAttribute("data-error", detail);
    if (!english && !/[\u3400-\u9fff]/.test(detail)) {
      var labels = [
        ["Missing artwork: ", "缺少画面资源："],
        ["Missing game data: ", "缺少游戏数据："],
        ["Missing audio score", "缺少游戏音乐"],
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
  root.JackalStartup = { fail: fail };
  root.addEventListener("error", function (event) {
    if (event.target && event.target.tagName === "SCRIPT") {
      fail("Could not load " + event.target.getAttribute("src"));
    } else if (event.message) {
      fail(event.error || event.message);
    }
  }, true);
  root.addEventListener("unhandledrejection", function (event) {
    fail(event.reason);
  });
})(window);
