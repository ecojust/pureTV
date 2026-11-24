/* DeviceOrientation steering, independent of the LAN transport and game rules.
 * The projected gravity vector avoids Euler jumps around beta +/-180 degrees.
 * Phone tilt is virtual steering input; no real steering-wheel torque is measured. */
(function (root) {
  'use strict';
  var RAD = Math.PI / 180, DEG = 180 / Math.PI;
  function clamp(value, lo, hi) { return Math.max(lo, Math.min(hi, value)); }
  function wrap(value) { return Math.atan2(Math.sin(value * RAD), Math.cos(value * RAD)) * DEG; }
  function screenAngle() {
    var angle = root.screen && root.screen.orientation && root.screen.orientation.angle;
    if (!Number.isFinite(angle)) angle = Number(root.orientation) || 0;
    return angle;
  }
  function wheelAngle(beta, gamma, orientation) {
    if (!Number.isFinite(beta) || !Number.isFinite(gamma) || Math.abs(beta) > 180 || Math.abs(gamma) > 90) return null;
    var b = beta * RAD, g = gamma * RAD, screen = orientation * RAD;
    var gx = -Math.cos(b) * Math.sin(g), gy = Math.sin(b);
    var x = gx * Math.cos(screen) + gy * Math.sin(screen);
    var y = -gx * Math.sin(screen) + gy * Math.cos(screen);
    // A phone lying flat has no useful wheel-plane gravity direction.
    if (Math.hypot(x, y) < .25) return null;
    return -Math.atan2(x, y) * DEG;
  }
  function Steering(options) {
    this.options = options || {}; this.enabled = false; this.active = false; this.disposed = false;
    this.status = 'off'; this.value = 0; this.degrees = 0; this.center = null; this.latest = null;
    this.lastSample = 0; this.orientation = screenAngle(); this.pending = 0; this.timer = 0; this.startTimer = 0;
    var self = this;
    this.listener = function (event) { self.sample(event); };
    this.rotation = function () { self.orientation = screenAngle(); self.recenter(); };
  }
  Steering.prototype.report = function (status) {
    var changed = this.status !== status; this.status = status;
    if (changed && this.options.onStatus) this.options.onStatus(status);
  };
  Steering.prototype.emit = function (value, degrees) {
    value = Math.round(clamp(value, -1, 1) * 1000) / 1000;
    var changed = value !== this.value || Math.abs(degrees - this.degrees) > .2;
    this.value = value; this.degrees = degrees;
    if (changed && this.options.onChange) this.options.onChange(value, degrees);
  };
  Steering.prototype.enable = function (requestPermission) {
    var self = this, generation = ++this.pending;
    if (this.disposed) return Promise.resolve(false);
    if (!root.isSecureContext) { this.report('insecure'); return Promise.resolve(false); }
    var api = root.DeviceOrientationEvent;
    if (!api) { this.report('unavailable'); return Promise.resolve(false); }
    if (typeof api.requestPermission === 'function' && !requestPermission) {
      this.report('permission'); return Promise.resolve(false);
    }
    this.report('requesting');
    var result;
    // Calling requestPermission synchronously here retains the button's user activation.
    try { result = typeof api.requestPermission === 'function' ? api.requestPermission() : 'granted'; }
    catch (_) { this.report('denied'); return Promise.resolve(false); }
    return Promise.resolve(result).then(function (permission) {
      if (self.disposed || generation !== self.pending) return false;
      if (permission !== 'granted') { self.report('denied'); return false; }
      self.enabled = true; self.orientation = screenAngle(); self.recenter();
      root.addEventListener('deviceorientation', self.listener);
      root.addEventListener('orientationchange', self.rotation);
      if (root.screen && root.screen.orientation && root.screen.orientation.addEventListener) root.screen.orientation.addEventListener('change', self.rotation);
      if (!self.timer) self.timer = root.setInterval(function () {
        if (self.active && self.lastSample && performance.now() - self.lastSample > 500) {
          self.center = null; self.latest = null; self.lastSample = 0; self.emit(0, 0); self.report('stale');
        }
      }, 80);
      root.clearTimeout(self.startTimer);
      self.startTimer = root.setTimeout(function () {
        if (self.enabled && self.latest === null) { self.emit(0, 0); self.report('unavailable'); }
      }, 3500);
      return true;
    }, function () { if (generation === self.pending) self.report('denied'); return false; });
  };
  Steering.prototype.setActive = function (active) {
    active = !!active && this.enabled && !this.disposed;
    if (active === this.active) return;
    this.active = active; this.recenter();
  };
  Steering.prototype.recenter = function () {
    this.center = null; this.latest = null; this.lastSample = 0; this.emit(0, 0);
    if (this.enabled) this.report(this.active ? 'calibrating' : 'standby');
    root.clearTimeout(this.startTimer);
    if (this.enabled && this.active) { var self = this; this.startTimer = root.setTimeout(function () { if (self.enabled && self.active && self.latest === null) self.report('unavailable'); }, 3500); }
  };
  Steering.prototype.sample = function (event) {
    if (!this.enabled || this.disposed) return;
    var current = screenAngle();
    if (current !== this.orientation) { this.orientation = current; this.recenter(); }
    var angle = wheelAngle(event.beta, event.gamma, current);
    if (angle === null) { this.center = null; this.latest = null; this.lastSample = 0; this.emit(0, 0); this.report('upright'); return; }
    var now = performance.now(), dt = this.lastSample ? clamp((now - this.lastSample) / 1000, .001, .1) : .02;
    this.latest = angle; this.lastSample = now; root.clearTimeout(this.startTimer);
    if (!this.active) { this.emit(0, 0); this.report('standby'); return; }
    if (this.center === null) { this.center = angle; this.emit(0, 0); this.report('ready'); return; }
    var degrees = wrap(angle - this.center), magnitude = Math.abs(degrees);
    var target = magnitude <= 2 ? 0 : Math.sign(degrees) * Math.pow(clamp((magnitude - 2) / 43, 0, 1), 1.15);
    var value = this.value + (target - this.value) * (1 - Math.exp(-dt * 15));
    if (Math.abs(target - value) < .004) value = target;
    this.emit(value, degrees); this.report('ready');
  };
  Steering.prototype.disable = function () {
    this.pending++; this.enabled = this.active = false;
    root.removeEventListener('deviceorientation', this.listener); root.removeEventListener('orientationchange', this.rotation);
    if (root.screen && root.screen.orientation && root.screen.orientation.removeEventListener) root.screen.orientation.removeEventListener('change', this.rotation);
    root.clearInterval(this.timer); root.clearTimeout(this.startTimer); this.timer = this.startTimer = 0;
    this.center = this.latest = null; this.lastSample = 0; this.emit(0, 0); this.report('off');
  };
  Steering.prototype.dispose = function () { if (this.disposed) return; this.disable(); this.disposed = true; };
  Steering.wheelAngle = wheelAngle; Steering.wrap = wrap;
  root.UsedCarSteering = Steering;
})(window);
