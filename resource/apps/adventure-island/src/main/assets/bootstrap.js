/* Keep startup diagnostics readable even when another script cannot be parsed. */
(function (root) {
  "use strict";
  var failed = false;
  function fail(error) {
    if (failed) return;
    failed = true;
    var english = false;
    try {
      english =
        JSON.parse(root.AdventureHost.getInfo()).language.indexOf("en") === 0;
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
  root.AdventureStartup = { fail: fail };
  root.addEventListener(
    "error",
    function (event) {
      if (event.target && event.target.tagName === "SCRIPT") {
        fail("Could not load " + event.target.getAttribute("src"));
      } else if (event.message) {
        fail(event.error || event.message);
      }
    },
    true,
  );
  root.addEventListener("unhandledrejection", function (event) {
    fail(event.reason);
  });
})(window);
