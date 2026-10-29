/* Deterministic local cooperative simulation; every economic action saves atomically. */
(function (root) {
  "use strict";
  var W =
    root.CozyIslandWorld ||
    (typeof require === "function" ? require("./world.js") : null);
  var SAVE_KEY = "cozy-island-save-v1",
    CAPACITY = 24;
  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }
  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
  function count(inv) {
    return Object.keys(inv).reduce(function (sum, k) {
      return sum + inv[k];
    }, 0);
  }
  function finite(v) {
    return typeof v === "number" && isFinite(v);
  }
  function integer(v, min, max) {
    return finite(v) && Math.floor(v) === v && v >= min && v <= max;
  }
  function validInventory(inv) {
    return (
      inv &&
      typeof inv === "object" &&
      !Array.isArray(inv) &&
      Object.keys(inv).every(function (k) {
        return (
          Object.prototype.hasOwnProperty.call(W.items, k) &&
          integer(inv[k], 0, CAPACITY)
        );
      }) &&
      count(inv) <= CAPACITY
    );
  }
  function makePlayer(id) {
    return {
      id: id,
      joined: id === 1,
      active: id === 1,
      alive: true,
      x: 11.2 + id * 0.7,
      y: 12.3,
      location: "island",
      facing: { x: 0, y: 1 },
      inventory: {},
      tool: "hand",
      menu: null,
      fishing: null,
      message: "",
      messageTime: 0,
      previous: {},
      menuDelay: 0,
      everConnected: false,
    };
  }
  class CozyIslandGame {
    constructor(options) {
      options = options || {};
      this.language =
        String(options.language || "zh").indexOf("en") === 0 ? "en" : "zh";
      this.storage = options.storage || null;
      this.now =
        options.now ||
        function () {
          return Date.now();
        };
      this.random = options.random || Math.random;
      this.phase = "title";
      this.manualPause = false;
      this.pausedReason = "";
      this.selectedPlayers = 1;
      this.players = [makePlayer(1), makePlayer(2)];
      this.coins = 20;
      this.houseLevel = 0;
      this.clock = 540;
      this.harvested = {};
      this.decorations = [];
      this.completed = [];
      this.fishJournal = {};
      this.nextDecoration = 1;
      this.muted = false;
      this.soundEvents = [];
      this.particles = [];
      this.frame = 0;
      this.elapsed = 0;
      this.saveElapsed = 0;
      this.saveRecovered = false;
      this.saveUnavailable = false;
      this.load();
    }
    tr(zh, en) {
      return this.language === "en" ? en : zh;
    }
    itemName(key) {
      return W.items[key] ? W.items[key][this.language] : key;
    }
    notify(p, zh, en, sound) {
      p.message = this.tr(zh, en);
      p.messageTime = 5;
      if (sound) this.soundEvents.push(sound);
    }
    validJournal(journal) {
      return journal && typeof journal === "object" && !Array.isArray(journal) &&
        Object.keys(journal).every(function (id) {
          var species = W.fish.find(function (f) { return f.id === id; }),
            record = journal[id];
          return species && record && integer(record.count, 1, 1000000) &&
            integer(record.best, species.min, species.max);
        });
    }
    validSave(s) {
      return (
        s &&
        s.version === 1 &&
        (s.fishJournal === undefined || this.validJournal(s.fishJournal)) &&
        integer(s.coins, 0, 999999) &&
        integer(s.houseLevel, 0, 2) &&
        integer(s.selectedPlayers, 1, 2) &&
        finite(s.clock) &&
        s.clock >= 0 &&
        s.clock < 1e10 &&
        finite(s.savedAt) &&
        Array.isArray(s.players) &&
        s.players.length === 2 &&
        s.players.every(function (p) {
          return (
            p &&
            validInventory(p.inventory) &&
            finite(p.x) &&
            finite(p.y) &&
            ["island", "home"].indexOf(p.location) >= 0 &&
            (p.location === "island"
              ? W.onLand(p.x, p.y)
              : p.x >= 0.45 && p.x <= 7.55 && p.y >= 0.45 && p.y <= 6.6)
          );
        }) &&
        Array.isArray(s.completed) &&
        s.completed.length <= W.tasks.length &&
        s.completed.every(function (id) {
          return W.tasks.some(function (t) {
            return t.id === id;
          });
        }) &&
        new Set(s.completed).size === s.completed.length &&
        s.harvested &&
        typeof s.harvested === "object" &&
        !Array.isArray(s.harvested) &&
        Object.keys(s.harvested).every(function (id) {
          return (
            W.nodes.some(function (n) {
              return n.id === id;
            }) &&
            finite(s.harvested[id]) &&
            s.harvested[id] >= 0 &&
            s.harvested[id] <= s.clock + 120
          );
        }) &&
        Array.isArray(s.decorations) &&
        s.decorations.length <= 60 &&
        s.decorations.every(function (d) {
          return (
            d &&
            integer(d.id, 1, 1000000) &&
            W.items[d.item] &&
            W.items[d.item].furniture &&
            finite(d.x) &&
            finite(d.y) &&
            integer(d.rotation, 0, 3) &&
            ["island", "home"].indexOf(d.location) >= 0 &&
            (d.location === "island"
              ? W.onLand(d.x, d.y)
              : d.x >= 0.7 && d.x <= 7.3 && d.y >= 0.7 && d.y <= 5.6)
          );
        }) &&
        new Set(
          s.decorations.map(function (d) {
            return d.id;
          }),
        ).size === s.decorations.length
      );
    }
    load() {
      if (!this.storage) return;
      try {
        var raw = this.storage.getItem(SAVE_KEY);
        if (!raw) return;
        var s = JSON.parse(raw);
        if (!this.validSave(s)) throw new Error("Invalid save");
        this.coins = s.coins;
        this.houseLevel = s.houseLevel;
        this.selectedPlayers = s.selectedPlayers;
        this.clock =
          s.clock + clamp((this.now() - s.savedAt) / 1000, 0, 8 * 3600);
        this.harvested = Object.assign({}, s.harvested);
        this.decorations = s.decorations;
        this.completed = s.completed;
        this.fishJournal = s.fishJournal || {};
        this.nextDecoration = this.decorations.reduce(function (m, d) {
          return Math.max(m, d.id + 1);
        }, 1);
        this.muted = !!s.muted;
        this.players.forEach(function (p, i) {
          p.inventory = Object.assign({}, s.players[i].inventory);
          p.x = s.players[i].x;
          p.y = s.players[i].y;
          p.location = s.players[i].location;
        });
      } catch (_) {
        this.saveRecovered = true;
      }
    }
    save() {
      if (!this.storage) return;
      var value = {
        version: 1,
        savedAt: this.now(),
        coins: this.coins,
        houseLevel: this.houseLevel,
        selectedPlayers: this.selectedPlayers,
        clock: this.clock,
        harvested: this.harvested,
        decorations: this.decorations,
        completed: this.completed,
        fishJournal: this.fishJournal,
        muted: this.muted,
        players: this.players.map(function (p) {
          return {
            x: p.x,
            y: p.y,
            location: p.location,
            inventory: p.inventory,
          };
        }),
      };
      try {
        this.storage.setItem(SAVE_KEY, JSON.stringify(value));
        this.saveUnavailable = false;
      } catch (_) {
        this.saveUnavailable = true;
      }
      this.saveElapsed = 0;
    }
    commit(sound) {
      this.save();
      if (sound) this.soundEvents.push(sound);
    }
    start() {
      this.players.forEach((p) => {
        p.joined = p.active = p.id <= this.selectedPlayers;
        p.menu = null;
        p.fishing = null;
      });
      this.phase = "playing";
      this.manualPause = false;
      this.pausedReason = "";
      this.commit("start");
    }
    toggleMusic() {
      this.muted = !this.muted;
      this.save();
    }
    has(p, needs) {
      return Object.keys(needs).every(function (k) {
        return (p.inventory[k] || 0) >= needs[k];
      });
    }
    roomFor(p, number) {
      return count(p.inventory) + number <= CAPACITY;
    }
    consume(p, needs) {
      Object.keys(needs).forEach(function (k) {
        p.inventory[k] = (p.inventory[k] || 0) - needs[k];
        if (!p.inventory[k]) delete p.inventory[k];
      });
    }
    add(p, key, number) {
      p.inventory[key] = (p.inventory[key] || 0) + number;
    }
    harvest(p, node) {
      if ((this.harvested[node.id] || 0) > this.clock) {
        this.notify(p, "正在恢复，稍后再来。", "Growing back. Come back soon.");
        return false;
      }
      if (!this.roomFor(p, node.amount)) {
        this.notify(
          p,
          "背包满了！去商店出售物品。",
          "Bag is full! Sell goods at the market.",
          "deny",
        );
        return false;
      }
      this.add(p, node.item, node.amount);
      this.harvested[node.id] = this.clock + 90;
      this.notify(
        p,
        "+" + node.amount + " " + this.itemName(node.item),
        "+" + node.amount + " " + this.itemName(node.item),
        "collect",
      );
      this.particles.push({
        x: node.x,
        y: node.y,
        life: 1,
        color: W.items[node.item].color,
      });
      this.commit();
      return true;
    }
    sell(p, key, all) {
      var n = p.inventory[key] || 0,
        item = W.items[key];
      if (!n || !item || !item.price) return false;
      n = all ? n : 1;
      this.consume(p, { [key]: n });
      this.coins = Math.min(999999, this.coins + item.price * n);
      this.notify(
        p,
        "出售成功！+" + item.price * n + " 金币",
        "Sold! +" + item.price * n + " coins",
      );
      this.commit("coin");
      return true;
    }
    buy(p, key) {
      var item = W.items[key];
      if (!item || !item.buy) return false;
      if (this.coins < item.buy) {
        this.notify(
          p,
          "金币不足，采集后到商店出售吧。",
          "Need more coins. Gather and sell some goods.",
          "deny",
        );
        return false;
      }
      if (!this.roomFor(p, 1)) {
        this.notify(
          p,
          "背包满了，先腾出一个位置。",
          "Bag full. Make room for one item.",
          "deny",
        );
        return false;
      }
      this.coins -= item.buy;
      this.add(p, key, 1);
      this.commit("coin");
      this.notify(
        p,
        "已购入：" + this.itemName(key),
        "Bought: " + this.itemName(key),
      );
      return true;
    }
    craft(p, key) {
      var recipe = W.items[key] && W.items[key].recipe;
      if (!recipe) return false;
      if (!this.has(p, recipe)) {
        this.notify(
          p,
          "材料不足：" + this.needsText(recipe),
          "Need materials: " + this.needsText(recipe),
          "deny",
        );
        return false;
      }
      this.consume(p, recipe);
      this.add(p, key, 1);
      this.commit("craft");
      this.notify(
        p,
        "制作完成：" + this.itemName(key),
        "Crafted: " + this.itemName(key),
      );
      return true;
    }
    upgrade(p) {
      if (this.houseLevel >= 2) {
        this.notify(p, "小屋已完全升级！", "Your home is fully upgraded!");
        return false;
      }
      var cost = this.houseLevel ? 220 : 100,
        needs = this.houseLevel
          ? { wood: 12, stone: 10 }
          : { wood: 8, stone: 6 };
      if (this.coins < cost || !this.has(p, needs)) {
        this.notify(
          p,
          "需要 " + cost + " 金币 · " + this.needsText(needs),
          "Need " + cost + " coins · " + this.needsText(needs),
          "deny",
        );
        return false;
      }
      this.coins -= cost;
      this.consume(p, needs);
      this.houseLevel++;
      this.commit("celebrate");
      this.notify(
        p,
        "小屋升级！房屋焕然一新。",
        "Home upgraded! Enjoy its new look.",
      );
      return true;
    }
    taskFor(npc) {
      return W.tasks.find(
        (t) =>
          t.npc === npc &&
          this.completed.indexOf(t.id) < 0 &&
          (!t.after || this.completed.indexOf(t.after) >= 0),
      );
    }
    deliver(p, task) {
      if (
        !task ||
        this.completed.indexOf(task.id) >= 0 ||
        (task.after && this.completed.indexOf(task.after) < 0)
      )
        return false;
      if (
        task.festival &&
        !(
          this.houseLevel >= 1 &&
          this.decorations.some(function (d) {
            return d.item === "bench";
          }) &&
          this.decorations.some(function (d) {
            return d.item === "lamp";
          }) &&
          this.completed.indexOf("shellgarden") >= 0
        )
      ) {
        this.notify(
          p,
          "完成皮普的任务、升级小屋并摆好长椅和灯。",
          "Finish Pip’s tasks, upgrade home, place a bench and lamp.",
          "deny",
        );
        return false;
      }
      if (!this.has(p, task.need)) {
        this.notify(
          p,
          "还需要：" + this.needsText(task.need),
          "Still needed: " + this.needsText(task.need),
          "deny",
        );
        return false;
      }
      var consumed = Object.keys(task.need).reduce(function (sum, k) {
        return sum + task.need[k];
      }, 0);
      if (task.gift && count(p.inventory) - consumed >= CAPACITY) {
        this.notify(
          p,
          "礼物需要一个背包位置。",
          "Make one bag space for your gift.",
          "deny",
        );
        return false;
      }
      this.consume(p, task.need);
      this.completed.push(task.id);
      this.coins = Math.min(999999, this.coins + task.coins);
      if (task.gift) this.add(p, task.gift, 1);
      this.notify(
        p,
        "谢谢你！+" +
          task.coins +
          " 金币" +
          (task.gift ? " · " + this.itemName(task.gift) : ""),
        "Thank you! +" +
          task.coins +
          " coins" +
          (task.gift ? " · " + this.itemName(task.gift) : ""),
      );
      this.commit("celebrate");
      return true;
    }
    needsText(needs) {
      return Object.keys(needs)
        .map((k) => this.itemName(k) + " ×" + needs[k])
        .join(" · ");
    }
    blocked(x, y, location, ignoreDecoration) {
      var point = { x: x, y: y };
      if (location === "home") {
        if (x < 0.45 || x > 7.55 || y < 0.45 || y > 6.6) return true;
      } else {
        if (!W.onLand(x, y)) return true;
        if (
          W.nodes.some(function (n) {
            return distance(point, n) < n.radius + 0.22;
          })
        )
          return true;
        if (
          W.landmarks.some(function (l) {
            return l.id !== "dock" && distance(point, l) < l.radius + 0.22;
          })
        )
          return true;
      }
      return this.decorations.some(function (d) {
        return (
          d.id !== ignoreDecoration &&
          d.location === location &&
          d.item !== "rug" &&
          distance(point, d) < (d.item === "bench" ? 0.7 : 0.48)
        );
      });
    }
    canPlace(p, key, x, y) {
      if (
        !W.items[key] ||
        !W.items[key].furniture ||
        this.decorations.length >= 60 ||
        distance(p, { x: x, y: y }) > 3.5 ||
        this.blocked(x, y, p.location)
      )
        return false;
      if (
        p.location === "home" &&
        (x < 0.8 ||
          x > 7.2 ||
          y < 0.8 ||
          y > 5.5 ||
          distance({ x: x, y: y }, { x: 4, y: 5.8 }) < 1)
      )
        return false;
      if (
        p.location === "island" &&
        (W.landmarks.some(function (l) {
          return (
            distance(
              { x: x, y: y },
              {
                x: l.x,
                y: l.y + (l.id === "house" || l.id === "shop" ? 1.6 : 0),
              },
            ) < 1.3
          );
        }) ||
          !W.onLand(x + 0.7, y) ||
          !W.onLand(x - 0.7, y) ||
          !W.onLand(x, y + 0.7) ||
          !W.onLand(x, y - 0.7))
      )
        return false;
      if (
        this.players.some(function (other) {
          return (
            other.joined &&
            other.location === p.location &&
            distance(other, { x: x, y: y }) < 0.8
          );
        })
      )
        return false;
      return !this.decorations.some(function (d) {
        return (
          d.location === p.location &&
          distance(d, { x: x, y: y }) <
            (key === "bench" || d.item === "bench" ? 1.3 : 1)
        );
      });
    }
    place(p, key, x, y, rotation) {
      if (!(p.inventory[key] > 0) || !this.canPlace(p, key, x, y)) {
        this.notify(
          p,
          "这里放不下。避开人物、道路和物品。",
          "No room here. Leave space around people and objects.",
          "deny",
        );
        return false;
      }
      this.consume(p, { [key]: 1 });
      this.decorations.push({
        id: this.nextDecoration++,
        item: key,
        x: x,
        y: y,
        location: p.location,
        rotation: rotation % 4,
      });
      this.commit("craft");
      this.notify(p, "装饰摆好了！", "Decoration placed!");
      return true;
    }
    remove(p) {
      var list = this.decorations
        .filter(function (d) {
          return d.location === p.location && distance(p, d) <= 2.2;
        })
        .sort(function (a, b) {
          return distance(p, a) - distance(p, b);
        });
      if (!list.length) {
        this.notify(
          p,
          "走近装饰后再收起。",
          "Move closer to a decoration to pick it up.",
        );
        return false;
      }
      if (!this.roomFor(p, 1)) {
        this.notify(
          p,
          "背包满了，无法收起装饰。",
          "Bag full. Cannot pick up decoration.",
          "deny",
        );
        return false;
      }
      this.decorations.splice(this.decorations.indexOf(list[0]), 1);
      this.add(p, list[0].item, 1);
      this.commit("collect");
      return true;
    }
    availableFish() {
      var hour = (this.clock / 60) % 24;
      return W.fish.filter(function (f) {
        return f.from < f.to ? hour >= f.from && hour < f.to : hour >= f.from || hour < f.to;
      });
    }
    rollFish() {
      var available = this.availableFish(),
        total = available.reduce(function (sum, f) { return sum + f.weight; }, 0),
        roll = clamp(this.random(), 0, 0.999999) * total;
      for (var i = 0; i < available.length; i++) {
        roll -= available[i].weight;
        if (roll < 0) return available[i];
      }
      return available[0];
    }
    startFishing(p) {
      if (p.location !== "island" || distance(p, W.landmarks[5]) > 2.3) {
        this.notify(
          p,
          "带上钓竿，到东侧码头按 A。",
          "Take your rod to the east pier and press A.",
        );
        return false;
      }
      if (!this.roomFor(p, 1)) {
        this.notify(
          p,
          "背包满了，先去出售物品。",
          "Bag full. Sell some goods first.",
          "deny",
        );
        return false;
      }
      var species = this.rollFish();
      p.fishing = {
        phase: "waiting", remaining: 1.8 + this.random() * 2.2,
        species: species.id, nibbles: Math.floor(clamp(this.random(), 0, 0.999999) * 3),
        window: species.window,
      };
      this.notify(
        p,
        "等待浮标下沉…出现「咬钩！」后按 A。",
        "Wait for the bobber… Press A when it says BITE!",
      );
      this.soundEvents.push("cast");
      return true;
    }
    reel(p) {
      if (!p.fishing) return this.startFishing(p);
      if (p.fishing.phase === "bite" && this.roomFor(p, 1)) {
        var species = W.fish.find(function (f) { return f.id === p.fishing.species; }) || W.fish[0],
          size = species.min + Math.floor(clamp(this.random(), 0, 0.999999) * (species.max - species.min + 1)),
          record = this.fishJournal[species.id],
          first = !record;
        this.add(p, "fish", 1);
        this.fishJournal[species.id] = {
          count: Math.min(1000000, (record ? record.count : 0) + 1),
          best: Math.max(record ? record.best : 0, size),
        };
        if (first) this.coins = Math.min(999999, this.coins + 10);
        this.commit("collect");
        this.notify(p,
          "钓到了！" + species.zh + " " + size + " cm" + (first ? " · 图鉴新增 +10 金币" : ""),
          "Caught! " + species.en + " " + size + " cm" + (first ? " · New entry +10 coins" : ""));
      } else if (p.fishing.phase === "bite")
        this.notify(
          p,
          "背包满了，鱼游走了。先到商店出售物品。",
          "Bag full. The fish escaped. Sell some goods at the market.",
          "deny",
        );
      else
        this.notify(
          p,
          "太早了，鱼游走了。再试一次！",
          "Too early! The fish swam away. Try again.",
          "deny",
        );
      p.fishing = null;
    }
    nearby(p) {
      if (p.location === "home")
        return p.y > 5.25 && Math.abs(p.x - 4) < 1.5
          ? { id: "exit", zh: "走出小屋", en: "Leave home" }
          : null;
      var candidates = W.nodes
        .concat(
          W.landmarks.filter(function (l) {
            return l.id !== "dock";
          }),
        )
        .map(function (v) {
          return {
            source: v,
            distance: distance(p, {
              x: v.x,
              y: v.y + (v.id === "house" || v.id === "shop" ? 1.55 : 0),
            }),
          };
        })
        .filter(function (v) {
          return v.distance < 1.35;
        })
        .sort(function (a, b) {
          return a.distance - b.distance;
        });
      return candidates.length ? candidates[0].source : null;
    }
    action(p) {
      if (p.tool === "rod" || p.fishing) {
        this.reel(p);
        return;
      }
      var target = this.nearby(p);
      if (!target) {
        this.notify(
          p,
          "靠近树、石头、居民或建筑按 A；B 打开背包。",
          "Approach trees, rocks, residents or buildings and press A. B opens your bag.",
        );
        return;
      }
      if (target.item) {
        this.harvest(p, target);
        return;
      }
      if (target.id === "exit") {
        p.location = "island";
        p.x = 8.5;
        p.y = 9.1;
        this.commit("step");
        return;
      }
      if (target.id === "house") {
        p.location = "home";
        p.x = 4;
        p.y = 5.8;
        this.commit("step");
        this.notify(
          p,
          "欢迎回家！B → 装饰，布置你的小屋。",
          "Welcome home! B → Decorate to furnish your room.",
        );
        return;
      }
      p.menu = { kind: target.id, index: 0 };
      this.soundEvents.push("menu");
    }
    menuRows(p) {
      var kind = p.menu && p.menu.kind,
        rows = [],
        self = this;
      function row(zh, en, action, arg) {
        rows.push({ label: self.tr(zh, en), action: action, arg: arg });
      }
      if (kind === "bag") {
        row("背包物品", "Inventory", "open", "inventory");
        row("制作家具", "Craft furniture", "open", "craft");
        row("装饰 / 收起", "Decorate / pick up", "open", "decorate");
        row("居民任务与指南", "Requests + guide", "open", "tasks");
        row(
          "音乐：" + (this.muted ? "关" : "开"),
          "Music: " + (this.muted ? "off" : "on"),
          "music",
        );
        row("回到标题（已保存）", "Save and return to title", "title");
        row("重置小岛…", "Reset island…", "open", "reset");
        row("鱼类图鉴 · " + Object.keys(this.fishJournal).length + "/" + W.fish.length,
          "Fish journal · " + Object.keys(this.fishJournal).length + "/" + W.fish.length, "open", "journal");
        row("继续散步", "Keep exploring", "close");
      } else if (kind === "journal") {
        W.fish.forEach(function (f) {
          var record = self.fishJournal[f.id],
            hours = f.from === 0 && f.to === 24 ? self.tr("全天", "All day") : f.from + ":00–" + f.to + ":00",
            label = f[self.language] + " · " + (record ? record.count + " × / " + record.best + " cm" : self.tr("未发现", "Undiscovered")) + " · " + hours;
          row(label, label, "none");
        });
      } else if (kind === "inventory") {
        Object.keys(p.inventory).forEach(function (k) {
          row(
            self.itemName(k) + " ×" + p.inventory[k],
            self.itemName(k) + " ×" + p.inventory[k],
            W.items[k].furniture ? "place" : "inspect",
            k,
          );
        });
        if (!rows.length)
          row(
            "背包空空，去采集吧！",
            "Your bag is empty. Gather something!",
            "none",
          );
      } else if (kind === "shop") {
        row("出售采集物", "Sell gathered goods", "open", "sell");
        row("购买家具", "Buy furniture", "open", "buy");
        row("升级小屋", "Upgrade home", "open", "upgrade");
      } else if (kind === "sell") {
        Object.keys(p.inventory)
          .filter(function (k) {
            return W.items[k].price > 0;
          })
          .forEach(function (k) {
            row(
              self.itemName(k) +
                " ×" +
                p.inventory[k] +
                " → " +
                W.items[k].price * p.inventory[k] +
                " 金币",
              self.itemName(k) +
                " ×" +
                p.inventory[k] +
                " → " +
                W.items[k].price * p.inventory[k] +
                " coins",
              "sell",
              k,
            );
          });
        if (!rows.length) row("没有可以出售的物品", "No goods to sell", "none");
      } else if (kind === "buy" || kind === "craft") {
        Object.keys(W.items)
          .filter(function (k) {
            return kind === "buy" ? W.items[k].buy : W.items[k].recipe;
          })
          .forEach(function (k) {
            var desc =
              kind === "buy"
                ? W.items[k].buy + " " + self.tr("金币", "coins")
                : self.needsText(W.items[k].recipe);
            row(
              self.itemName(k) + " · " + desc,
              self.itemName(k) + " · " + desc,
              kind,
              k,
            );
          });
      } else if (kind === "decorate") {
        Object.keys(p.inventory)
          .filter(function (k) {
            return W.items[k].furniture;
          })
          .forEach(function (k) {
            row(
              "摆放 " + self.itemName(k) + " ×" + p.inventory[k],
              "Place " + self.itemName(k) + " ×" + p.inventory[k],
              "place",
              k,
            );
          });
        row("收起附近的装饰", "Pick up nearest decoration", "remove");
      } else if (kind === "upgrade") {
        row(
          this.houseLevel >= 2
            ? "小屋已完全升级"
            : "升级：" + (this.houseLevel ? 220 : 100) + " 金币",
          this.houseLevel >= 2
            ? "Home fully upgraded"
            : "Upgrade: " + (this.houseLevel ? 220 : 100) + " coins",
          "upgrade",
        );
        if (this.houseLevel < 2)
          row(
            this.needsText(
              this.houseLevel ? { wood: 12, stone: 10 } : { wood: 8, stone: 6 },
            ),
            this.needsText(
              this.houseLevel ? { wood: 12, stone: 10 } : { wood: 8, stone: 6 },
            ),
            "none",
          );
      } else if (kind === "mira" || kind === "pip") {
        var task = this.taskFor(kind);
        if (task) {
          row(task[this.language], "", "deliver", task.id);
          rows[0].label = task[this.language];
          row(
            "交付奖励：" +
              task.coins +
              " 金币" +
              (task.gift ? " + " + this.itemName(task.gift) : ""),
            "Reward: " +
              task.coins +
              " coins" +
              (task.gift ? " + " + this.itemName(task.gift) : ""),
            "none",
          );
        } else
          row(
            "谢谢你让小岛更温暖！",
            "Thank you for making our island a home!",
            "none",
          );
        row(
          kind === "mira"
            ? "米拉：慢慢来，和朋友分享收获吧。"
            : "皮普：码头的鱼喜欢耐心的人。",
          kind === "mira"
            ? "Mira: Take your time. Share what you find."
            : "Pip: Fish at the pier reward a little patience.",
          "none",
        );
      } else if (kind === "tasks") {
        row(
          "A 采集/交谈 · B 背包 · SELECT 钓竿",
          "A gather/talk · B bag · SELECT rod",
          "none",
        );
        row(
          "先收集蜜桃与木材，交给米拉和皮普。",
          "Gather peaches and wood for Mira and Pip.",
          "none",
        );
        row(
          "商店出售换金币；制作台可制作家具。",
          "Sell at the market; craft at the workbench.",
          "none",
        );
        W.tasks.forEach(function (t) {
          row(
            (self.completed.indexOf(t.id) >= 0 ? "✓ " : "○ ") +
              t[self.language],
            (self.completed.indexOf(t.id) >= 0 ? "✓ " : "○ ") +
              t[self.language],
            "none",
          );
        });
      } else if (kind === "reset") {
        row("保留我的小岛", "Keep my island", "close");
        row(
          "确认清空所有玩家的存档",
          "Erase this island for both players",
          "reset",
        );
      }
      if (kind !== "bag" && kind !== "reset") row("返回", "Back", "back");
      return rows;
    }
    choose(p) {
      var rows = this.menuRows(p),
        row = rows[p.menu.index];
      if (!row) return;
      if (row.action === "open") {
        p.menu = { kind: row.arg, index: 0 };
        return;
      }
      if (row.action === "close") {
        p.menu = null;
        return;
      }
      if (row.action === "back") {
        p.menu = { kind: "bag", index: 0 };
        return;
      }
      if (row.action === "place") {
        p.menu = {
          kind: "place",
          item: row.arg,
          index: 0,
          x: p.x + 1.3,
          y: p.y,
          rotation: 0,
        };
        return;
      }
      if (row.action === "sell") this.sell(p, row.arg, true);
      if (row.action === "buy") this.buy(p, row.arg);
      if (row.action === "craft") this.craft(p, row.arg);
      if (row.action === "upgrade") this.upgrade(p);
      if (row.action === "remove") this.remove(p);
      if (row.action === "music") this.toggleMusic();
      if (row.action === "deliver")
        this.deliver(
          p,
          W.tasks.find(function (t) {
            return t.id === row.arg;
          }),
        );
      if (row.action === "inspect")
        this.notify(
          p,
          "可出售或完成居民任务。",
          "Sell this at the market or deliver it to a resident.",
        );
      if (row.action === "title") {
        this.phase = "title";
        this.players.forEach(function (v) {
          v.menu = null;
          v.fishing = null;
        });
        this.save();
        return;
      }
      if (row.action === "reset") {
        this.coins = 20;
        this.houseLevel = 0;
        this.clock = 540;
        this.harvested = {};
        this.decorations = [];
        this.completed = [];
        this.fishJournal = {};
        this.nextDecoration = 1;
        this.players = [makePlayer(1), makePlayer(2)];
        this.phase = "title";
        this.manualPause = false;
        this.commit("start");
        return;
      }
      if (p.menu)
        p.menu.index = Math.min(
          p.menu.index,
          Math.max(0, this.menuRows(p).length - 1),
        );
    }
    step(dt, inputs) {
      dt = clamp(Number(dt) || 0, 0, 0.25);
      inputs = inputs || [];
      this.frame++;
      this.soundEvents = this.soundEvents.slice(-12);
      var start = false,
        select = false,
        edges = {};
      this.players.forEach(function (p) {
        var input =
          inputs.find(function (v) {
            return Number(v.id) === p.id;
          }) || {};
        var connected = !!input.connected;
        p.connected = connected;
        if (connected) p.everConnected = true;
        var edge = {};
        ["a", "b", "start", "select"].forEach(function (k) {
          edge[k] = connected && !!input[k] && !p.previous[k];
          p.previous[k] = connected && !!input[k];
        });
        edges[p.id] = edge;
        if (edge.start) start = true;
        if (edge.select) select = true;
      });
      if (this.phase === "title") {
        if (select) this.selectedPlayers = this.selectedPlayers === 1 ? 2 : 1;
        if (start || edges[1].a || edges[2].a) this.start();
        return;
      }
      if (start) {
        this.manualPause = !this.manualPause;
        this.save();
      }
      var disconnected = this.players.some(function (p) {
        return p.joined && p.everConnected && !p.connected;
      });
      this.pausedReason = this.manualPause
        ? "manual"
        : disconnected
          ? "disconnect"
          : "";
      this.phase = this.pausedReason ? "paused" : "playing";
      if (this.phase === "paused") {
        if (select && this.manualPause) this.toggleMusic();
        return;
      }
      this.clock += dt;
      this.elapsed += dt;
      this.saveElapsed += dt;
      this.particles.forEach(function (p) {
        p.life -= dt;
      });
      this.particles = this.particles.filter(function (p) {
        return p.life > 0;
      });
      for (var i = 0; i < this.players.length; i++) {
        var p = this.players[i];
        if (!p.joined) continue;
        var input =
          inputs.find(function (v) {
            return Number(v.id) === p.id;
          }) || {};
        if (!p.connected) continue;
        var edge = edges[p.id],
          ix = clamp(Number(input.x) || 0, -1, 1),
          iy = clamp(Number(input.y) || 0, -1, 1),
          len = Math.hypot(ix, iy);
        if (len > 1) {
          ix /= len;
          iy /= len;
        }
        if (len < 0.16) {
          ix = 0;
          iy = 0;
        }
        p.messageTime = Math.max(0, p.messageTime - dt);
        p.menuDelay = Math.max(0, p.menuDelay - dt);
        if (edge.b) {
          if (p.fishing) {
            p.fishing = null;
            this.notify(p, "收起鱼线。", "Line reeled in.");
          } else if (p.menu) {
            p.menu = p.menu.kind === "bag" ? null : { kind: "bag", index: 0 };
          } else p.menu = { kind: "bag", index: 0 };
          continue;
        }
        if (p.menu) {
          if (p.menu.kind === "place") {
            p.menu.x += (ix + iy) * 2.1 * dt;
            p.menu.y += (iy - ix) * 2.1 * dt;
            p.menu.x = clamp(p.menu.x, p.x - 3, p.x + 3);
            p.menu.y = clamp(p.menu.y, p.y - 3, p.y + 3);
            if (edge.select) p.menu.rotation = (p.menu.rotation + 1) % 4;
            if (
              edge.a &&
              this.place(p, p.menu.item, p.menu.x, p.menu.y, p.menu.rotation)
            )
              p.menu = null;
          } else {
            if (Math.abs(iy) > 0.45 && p.menuDelay === 0) {
              var size = this.menuRows(p).length;
              p.menu.index = (p.menu.index + (iy > 0 ? 1 : -1) + size) % size;
              p.menuDelay = 0.2;
            }
            if (edge.a) this.choose(p);
          }
          continue;
        }
        if (edge.select) {
          p.fishing = null;
          p.tool = p.tool === "hand" ? "rod" : "hand";
          this.notify(
            p,
            p.tool === "rod"
              ? "钓竿：去东侧码头按 A。"
              : "空手：A 采集、交谈、进屋。",
            p.tool === "rod"
              ? "Fishing rod: press A at the east pier."
              : "Hands: A gathers, talks and enters buildings.",
          );
        }
        if (p.fishing) {
          p.fishing.remaining -= dt;
          if (p.fishing.remaining <= 0) {
            if (p.fishing.phase === "nibble") {
              p.fishing.phase = "waiting";
              p.fishing.remaining = 0.65 + this.random() * 0.5;
            } else if (p.fishing.phase === "waiting") {
              if (p.fishing.nibbles > 0) {
                p.fishing.nibbles--;
                p.fishing.phase = "nibble";
                p.fishing.remaining = 0.3;
                this.notify(p, "轻轻试探…先别收线。", "A nibble… wait before reeling.");
              } else {
                p.fishing.phase = "bite";
                p.fishing.remaining = p.fishing.window || 1.2;
                this.soundEvents.push("bite");
                this.notify(p, "咬钩！现在按 A！", "BITE! Press A now!");
              }
            } else {
              p.fishing = null;
              this.notify(
                p,
                "鱼游走了，再试一次！",
                "The fish escaped. Try again!",
                "deny",
              );
            }
          }
          if (edge.a) this.reel(p);
          continue;
        }
        var dx = (ix + iy) * 1.7,
          dy = (iy - ix) * 1.7;
        if (ix || iy) {
          p.facing = { x: dx / 2.4, y: dy / 2.4 };
          var nx = p.x + dx * dt,
            ny = p.y + dy * dt;
          if (!this.blocked(nx, p.y, p.location)) p.x = nx;
          if (!this.blocked(p.x, ny, p.location)) p.y = ny;
        }
        if (edge.a) this.action(p);
      }
      if (this.saveElapsed >= 1) this.save();
    }
    status() {
      return {
        title: this.tr("悠岛生活 TV", "Cozy Island TV"),
        phase: this.phase,
        selectedPlayers: this.selectedPlayers,
        pausedReason: this.pausedReason,
        coins: this.coins,
        houseLevel: this.houseLevel,
        day: Math.floor(this.clock / 1440) + 1,
        fishDiscovered: Object.keys(this.fishJournal).length,
        muted: this.muted,
        players: this.players.map((p) => ({
          id: p.id,
          joined: p.joined,
          active: p.joined,
          alive: true,
          lives: 1,
          score: this.coins,
          level: this.houseLevel + 1,
          stageLabel: p.menu
            ? this.tr("菜单", "Menu")
            : p.location === "home"
              ? this.tr("小屋", "Home")
              : this.tr("悠岛", "Cozy Island"),
          tool: p.tool,
          bagCount: count(p.inventory),
          bagCapacity: CAPACITY,
          location: p.location,
        })),
      };
    }
  }
  CozyIslandGame.SAVE_KEY = SAVE_KEY;
  CozyIslandGame.CAPACITY = CAPACITY;
  CozyIslandGame.World = W;
  CozyIslandGame.inventoryCount = count;
  root.CozyIslandGame = CozyIslandGame;
  if (typeof module !== "undefined") module.exports = CozyIslandGame;
})(typeof window !== "undefined" ? window : globalThis);
