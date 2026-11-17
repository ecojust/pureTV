/* Diagnostics must survive model or renderer parse/setup failures. */
(function (root) {
  "use strict";
  var failed = false;
  function fail(error) {
    if (failed) return;
    failed = true;
    var en = false;
    try {
      en =
        JSON.parse(root.CoastKartHost.getInfo()).language.indexOf("en") === 0;
    } catch (_) {}
    var panel = document.getElementById("game-loading");
    panel.hidden = false;
    panel.setAttribute("data-failed", "true");
    panel.setAttribute("role", "alert");
    document.getElementById("loading-title").textContent = en
      ? "The race could not start"
      : "比赛启动失败";
    document.getElementById("loading-detail").textContent = String(
      (error && error.message) || error || "Unknown error",
    );
  }
  root.CoastKartStartup = { fail: fail };
  root.addEventListener(
    "error",
    function (e) {
      if (e.target && e.target.tagName === "SCRIPT")
        fail("Could not load " + e.target.getAttribute("src"));
      else if (e.message) fail(e.error || e.message);
    },
    true,
  );
  root.addEventListener("unhandledrejection", function (e) {
    fail(e.reason);
  });
})(window);
