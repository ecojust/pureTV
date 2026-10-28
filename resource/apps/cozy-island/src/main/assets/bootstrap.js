/* Parse-safe startup errors remain visible beside the independent room sidebar. */
(function (root) {
  "use strict";
  var failed = false;
  function fail(error) {
    if (failed) return;
    failed = true;
    var english = false;
    try {
      english =
        JSON.parse(root.CozyIslandHost.getInfo()).language.indexOf("en") === 0;
    } catch (_) {}
    var panel = document.getElementById("game-loading");
    panel.hidden = false;
    panel.setAttribute("data-failed", "true");
    panel.setAttribute("role", "alert");
    document.getElementById("loading-title").textContent = english
      ? "Game could not start"
      : "游戏启动失败";
    document.getElementById("loading-detail").textContent = String(
      (error && error.message) || error || "Unknown error",
    );
  }
  root.CozyIslandStartup = { fail: fail };
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
