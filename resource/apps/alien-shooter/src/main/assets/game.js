/* All game rules, visuals and sound are included in the APK. */
AlienShooterBakedLoader.load().then(function () {
  startAlienShooter();
}).catch(function (error) {
  AlienShooterStartup.fail(error);
});
