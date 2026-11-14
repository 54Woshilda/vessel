/* 载体协议 VESSEL — 核心逻辑（无 DOM，可在 Node 中直接测试） */
(function (root) {
  'use strict';

  var CORE = {};

  CORE.STATE_VERSION = 1;

  CORE.ATTRS = [
    { id: 'pro', name: '专业', en: 'PRO', domain: 'career', desc: '产品 / 疾病 / 循证 / 合规' },
    { id: 'imp', name: '影响', en: 'IMP', domain: 'career', desc: '客户 / 谈判 / 跨部门 / 学术传递' },
    { id: 'res', name: '资源', en: 'RES', domain: 'career', desc: '时间 / 预算 / 信息 / 人脉' },
    { id: 'vit', name: '体魄', en: 'VIT', domain: 'body', desc: '力量 / 耐力 / 睡眠 / 体脂' },
    { id: 'img', name: '形象', en: 'IMG', domain: 'body', desc: '皮肤 / 发型 / 牙齿 / 体态 / 穿搭' },
    { id: 'pre', name: '气场', en: 'PRE', domain: 'body', desc: '声音 / 眼神 / 停顿 / 仪态' },
    { id: 'int', name: '智识', en: 'INT', domain: 'mind', desc: '学习 / 模型 / 决策 / 复盘' },
    { id: 'wil', name: '意志', en: 'WIL', domain: 'mind', desc: '执行 / 耐受 / 驳回冲动' },
    { id: 'cal', name: '定力', en: 'CAL', domain: 'mind', desc: '情绪治理 / 压力反应 / 恢复' },
    { id: 'tas', name: '品味', en: 'TAS', domain: 'life', desc: '审美 / 穿搭 / 艺术 / 质感' },
    { id: 'rel', name: '关系', en: 'REL', domain: 'life', desc: '家人 / 朋友 / 亲密 / 社交资本' },
    { id: 'fin', name: '财务', en: 'FIN', domain: 'life', desc: '储蓄 / 投资 / 保险 / 消费结构' }
  ];

  CORE.DOMAINS = [
    { id: 'career', name: '职业', color: '#5ad1ff', attrs: ['pro', 'imp', 'res'] },
    { id: 'body', name: '机体', color: '#ffb454', attrs: ['vit', 'img', 'pre'] },
    { id: 'mind', name: '心智', color: '#b18cff', attrs: ['int', 'wil', 'cal'] },
    { id: 'life', name: '生活', color: '#5be2a6', attrs: ['tas', 'rel', 'fin'] }
  ];

  CORE.ATTR_MAP = {};
  CORE.ATTRS.forEach(function (a) { CORE.ATTR_MAP[a.id] = a; });

  CORE.RANKS = [
    { min: 1, name: '观察体' },
    { min: 10, name: '执行体' },
    { min: 20, name: '猎手' },
    { min: 30, name: '策士' },
    { min: 40, name: '破局者' },
    { min: 50, name: '掌控者' },
    { min: 60, name: '造物者' }
  ];

  CORE.STAGES = [
    { pct: 0, name: '原始载体' },
    { pct: 20, name: '打磨中' },
    { pct: 40, name: '成形' },
    { pct: 65, name: '高阶' },
    { pct: 88, name: '终极形态' }
  ];

  CORE.DIFFICULTY = {
    hardcore: { name: '硬核', idleEntropy: 2, breakPenaltyDays: 3, breakPenalty: 0.8, residueMid: 7, residueHigh: 9, midPenalty: 0.85, highPenalty: 0.7, lootLegend: 3 },
    standard: { name: '标准', idleEntropy: 1, breakPenaltyDays: 2, breakPenalty: 0.9, residueMid: 8, residueHigh: 10, midPenalty: 0.9, highPenalty: 0.8, lootLegend: 5 },
    soft: { name: '温和', idleEntropy: 0, breakPenaltyDays: 0, breakPenalty: 1, residueMid: 99, residueHigh: 99, midPenalty: 1, highPenalty: 1, lootLegend: 8 }
  };

  CORE.URGE_VERDICTS = [
    { id: 'approve', name: '批准' },
    { id: 'reject', name: '驳回' },
    { id: 'delay', name: '延后' }
  ];

  CORE.LOOT_RARITY = {
    common: { name: '普通', weight: 50, shards: 1, bonus: 0.01, color: '#8d9bb0' },
    rare: { name: '稀有', weight: 30, shards: 2, bonus: 0.02, color: '#5ad1ff' },
    epic: { name: '史诗', weight: 15, shards: 4, bonus: 0.035, color: '#b18cff' },
    legendary: { name: '传说', weight: 5, shards: 10, bonus: 0.05, color: '#ffb454' }
  };

  /* ---------------- 基础工具 ---------------- */

  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function round1(n) { return Math.round(n * 10) / 10; }
  function round2(n) { return Math.round(n * 100) / 100; }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function hashStr(str) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function uid(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  function shuffle(arr, rng) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function pick(arr, rng) { return arr[Math.floor(rng() * arr.length)]; }

  /* ---------------- 时间 / 游戏日 ---------------- */

  function dayKeyOf(date, resetHour) {
    var d = new Date(date.getTime());
    var h = (resetHour == null ? 4 : resetHour);
    if (d.getHours() < h) d.setDate(d.getDate() - 1);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function parseDayKey(key) {
    var p = String(key).split('-').map(Number);
    return new Date(p[0], p[1] - 1, p[2], 12, 0, 0, 0);
  }

  function daysBetween(a, b) {
    return Math.round((parseDayKey(b).getTime() - parseDayKey(a).getTime()) / 86400000);
  }

  function weekKeyOf(dayKey) {
    var d = parseDayKey(dayKey);
    var target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    var dayNr = (target.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    var firstThursday = new Date(target.getFullYear(), 0, 4);
    var fDayNr = (firstThursday.getDay() + 6) % 7;
    firstThursday.setDate(firstThursday.getDate() - fDayNr + 3);
    var week = 1 + Math.round((target.getTime() - firstThursday.getTime()) / 604800000);
    return target.getFullYear() + '-W' + pad2(week);
  }

  CORE.dayKeyOf = dayKeyOf;
  CORE.parseDayKey = parseDayKey;
  CORE.daysBetween = daysBetween;
  CORE.weekKeyOf = weekKeyOf;

  /* ---------------- 等级 / 属性 ---------------- */

  CORE.needXp = function (level) { return 100 + 60 * (level - 1) + 10 * (level - 1) * (level - 1); };

  CORE.totalXpForLevel = function (level) {
    var t = 0;
    for (var i = 1; i < level; i++) t += CORE.needXp(i);
    return t;
  };

  CORE.levelFromXp = function (xp) {
    var lv = 1, rest = Math.max(0, xp);
    while (lv < 99 && rest >= CORE.needXp(lv)) { rest -= CORE.needXp(lv); lv++; }
    return lv;
  };

  CORE.rankOf = function (level) {
    var r = CORE.RANKS[0];
    for (var i = 0; i < CORE.RANKS.length; i++) if (level >= CORE.RANKS[i].min) r = CORE.RANKS[i];
    return r;
  };

  CORE.stageOf = function (pct) {
    var s = CORE.STAGES[0];
    for (var i = 0; i < CORE.STAGES.length; i++) if (pct >= CORE.STAGES[i].pct) s = CORE.STAGES[i];
    return s;
  };

  function attrGain(attrValue, base) {
    var dim = Math.max(0.15, 1 - attrValue / 110);
    return round1(base * dim);
  }

  CORE.attrGain = attrGain;

  /* ---------------- 难度配置 ---------------- */

  CORE.diff = function (state) {
    return CORE.DIFFICULTY[(state.settings && state.settings.difficulty) || 'standard'] || CORE.DIFFICULTY.standard;
  };

  /* ---------------- 状态初始化 / 规范化 ---------------- */

  function blankAttrs(start) {
    var o = {};
    CORE.ATTRS.forEach(function (a) { o[a.id] = start || 5; });
    return o;
  }

  function defaultState(now) {
    now = now || Date.now();
    var cal = {
      line: 'rx', terminal: 't3a', stage: 'growing', access: 'appointment',
      city: 't1', team: 'academic', hours: 7, budget: false
    };
    return {
      version: CORE.STATE_VERSION,
      createdAt: now,
      updatedAt: now,
      character: {
        codename: 'V-07',
        level: 1,
        xp: 0,
        attrs: blankAttrs(5),
        target: {
          pro: 80, imp: 80, res: 70, vit: 75, img: 80, pre: 80,
          int: 85, wil: 85, cal: 85, tas: 75, rel: 70, fin: 70
        },
        milestones: {},
        skills: [],
        title: '观察体',
        credo: [],
        stage: '原始载体'
      },
      settings: { resetHour: 4, difficulty: 'hardcore', sound: true, haptics: true, motion: true, theme: 'cyan' },
      calibration: cal,
      day: null,
      streak: { current: 0, best: 0, lastSettled: '', shields: 1, shieldMonth: '' },
      entropy: 0,
      residue: [],
      logs: [],
      protocols: [],
      loot: { owned: {}, equipped: [], shards: 0, pity: 0, totalRolls: 0 },
      boss: null,
      season: { index: 1, startKey: '', score: 0, shadow: 0, history: [] },
      inventory: { reroll: 1, shield: 1, focus: 2, points: 0 },
      intel: [],
      feedback: { lowRated: [], blockers: {}, feasibility: [] },
      meta: {
        onboarded: false,
        lastSeenDay: '',
        lastSeenAt: 0,
        lastExportAt: 0,
        contentVersion: '1.0',
        recentFamilies: [],
        recentMicro: [],
        counters: { residues: 0, converted: 0, settledDays: 0, allClearDays: 0, tasks: 0, rejected: 0, approved: 0 },
        migrations: []
      }
    };
  }

  CORE.defaultState = defaultState;

  CORE.normalizeState = function (raw) {
    var base = defaultState();
    if (!raw || typeof raw !== 'object') return base;
    var s = raw;
    function merge(dst, src) {
      if (!src || typeof src !== 'object') return dst;
      Object.keys(src).forEach(function (k) {
        if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k]) &&
            dst[k] && typeof dst[k] === 'object' && !Array.isArray(dst[k])) {
          merge(dst[k], src[k]);
        } else if (src[k] !== undefined) {
          dst[k] = src[k];
        }
      });
      return dst;
    }
    merge(base, s);
    base.version = CORE.STATE_VERSION;
    CORE.ATTRS.forEach(function (a) {
      if (typeof base.character.attrs[a.id] !== 'number') base.character.attrs[a.id] = 5;
      if (typeof base.character.target[a.id] !== 'number') base.character.target[a.id] = 80;
      base.character.attrs[a.id] = clamp(base.character.attrs[a.id], 1, 99);
    });
    base.character.level = CORE.levelFromXp(base.character.xp || 0);
    if (!Array.isArray(base.logs)) base.logs = [];
    if (!Array.isArray(base.residue)) base.residue = [];
    if (!Array.isArray(base.intel)) base.intel = [];
    if (!Array.isArray(base.protocols)) base.protocols = [];
    if (!base.meta.counters) base.meta.counters = { residues: 0, converted: 0, settledDays: 0, allClearDays: 0, tasks: 0, rejected: 0, approved: 0 };
    if (!Array.isArray(base.meta.recentFamilies)) base.meta.recentFamilies = [];
    if (!Array.isArray(base.meta.recentMicro)) base.meta.recentMicro = [];
    if (!Array.isArray(base.loot.equipped)) base.loot.equipped = [];
    if (!base.loot.owned) base.loot.owned = {};
    return base;
  };

  /* ---------------- 校准匹配 ---------------- */

  function matchWhen(when, cal) {
    if (!when) return true;
    for (var k in when) {
      if (!Object.prototype.hasOwnProperty.call(when, k)) continue;
      var want = when[k];
      var cur = cal ? cal[k] : undefined;
      if (Array.isArray(want)) {
        if (Array.isArray(cur)) {
          if (!want.some(function (w) { return cur.indexOf(w) >= 0; })) return false;
        } else if (want.indexOf(cur) < 0) return false;
      } else if (typeof want === 'object') {
        if (want.min != null && (cur == null || cur < want.min)) return false;
        if (want.max != null && (cur == null || cur > want.max)) return false;
      } else if (cur !== want) return false;
    }
    return true;
  }

  CORE.matchWhen = matchWhen;

  CORE.selectVariant = function (family, cal) {
    if (!family) return null;
    var vs = family.variants || [];
    for (var i = 0; i < vs.length; i++) {
      if (CORE.matchWhen(vs[i].when, cal)) return vs[i];
    }
    return vs.length ? vs[vs.length - 1] : null;
  };

  CORE.relevantFamilies = function (state) {
    var list = (root.CONTENT && root.CONTENT.taskFamilies) || [];
    var banned = state.meta.bannedFamilies || [];
    return list.filter(function (f) {
      if (banned.indexOf(f.id) >= 0) return false;
      if (state.feedback && state.feedback.retired && state.feedback.retired.indexOf(f.id) >= 0) return false;
      return matchWhen(f.when, state.calibration);
    });
  };

  /* ---------------- 每日任务生成 ---------------- */

  function familyWeight(f, recent) {
    var w = f.weight || 1;
    if (recent.indexOf(f.id) >= 0) w *= 0.15;
    return w;
  }

  function weightedPick(list, rng, recent) {
    var total = 0;
    list.forEach(function (f) { total += familyWeight(f, recent); });
    if (total <= 0) return list[0];
    var r = rng() * total;
    for (var i = 0; i < list.length; i++) {
      r -= familyWeight(list[i], recent);
      if (r <= 0) return list[i];
    }
    return list[list.length - 1];
  }

  CORE.makeQuest = function (family, kind, state) {
    var v = CORE.selectVariant(family, state.calibration) || {};
    return {
      id: uid('q'),
      kind: kind,
      familyId: family.id,
      variantId: v.id || null,
      done: false,
      ts: 0,
      minutes: v.minutes || family.minutes || 30
    };
  };

  CORE.generateDay = function (state, dayKey) {
    var rng = mulberry32(hashStr(dayKey + '|' + state.character.codename + '|' + state.character.level + '|' + (state.inventory.reroll || 0)));
    var pool = CORE.relevantFamilies(state);
    var recent = state.meta.recentFamilies || [];
    var quests = [];
    var used = [];
    var usedDomains = [];

    /* 日常 3 条：尽量覆盖至少 2 个域 */
    var dailyPool = pool.filter(function (f) { return f.kind !== 'challenge'; });
    for (var i = 0; i < 3 && dailyPool.length; i++) {
      var candidates = dailyPool.filter(function (f) { return used.indexOf(f.id) < 0; });
      if (!candidates.length) break;
      var prefer = candidates.filter(function (f) { return usedDomains.indexOf(f.domain) < 0; });
      var f = weightedPick(prefer.length && i >= 1 ? prefer : candidates, rng, recent);
      used.push(f.id); usedDomains.push(f.domain);
      quests.push(CORE.makeQuest(f, 'daily', state));
    }

    /* 主线 1 条：离目标差距最大的域，优先职业/心智 */
    var gapPool = pool.filter(function (f) { return used.indexOf(f.id) < 0 && f.domain !== 'life'; });
    if (!gapPool.length) gapPool = pool.filter(function (f) { return used.indexOf(f.id) < 0; });
    if (gapPool.length) {
      var scored = gapPool.map(function (f) {
        var gap = f.domain === 'career' ? 1.15 : 1;
        var t = state.character.target[f.attr] || 80;
        var cur = state.character.attrs[f.attr] || 5;
        return { f: f, score: (t - cur) * gap * (0.7 + rng() * 0.6) };
      }).sort(function (a, b) { return b.score - a.score; });
      var mf = scored[0].f;
      used.push(mf.id);
      quests.push(CORE.makeQuest(mf, 'main', state));
    }

    /* 挑战 1 条 */
    var challengers = pool.filter(function (f) { return f.tier >= 3 || f.tags && f.tags.indexOf('hard') >= 0; });
    if (!challengers.length) challengers = pool;
    challengers = challengers.filter(function (f) { return used.indexOf(f.id) < 0; });
    if (challengers.length) {
      var cf = weightedPick(challengers, rng, recent);
      used.push(cf.id);
      quests.push(CORE.makeQuest(cf, 'challenge', state));
    }

    /* 微训练 1 条 */
    var micros = (root.CONTENT && root.CONTENT.micro) || [];
    if (micros.length) {
      var rm = state.meta.recentMicro || [];
      var mPool = micros.filter(function (m) { return rm.indexOf(m.id) < 0; });
      if (!mPool.length) mPool = micros;
      var mic = pick(mPool, rng);
      quests.push({ id: uid('m'), kind: 'micro', microId: mic.id, done: false, ts: 0, minutes: mic.minutes });
    }

    /* 事件卡 1 张 */
    var events = (root.CONTENT && root.CONTENT.events) || [];
    var ev = null;
    if (events.length) {
      ev = pick(events, rng);
      quests.push({ id: uid('e'), kind: 'event', eventId: ev.id, done: false, ts: 0, minutes: 5 });
    }

    return {
      key: dayKey,
      report: { sleep: 7, energy: 3, pain: 0, load: 3 },
      quests: quests,
      rerolls: 0,
      settled: false,
      allClear: false,
      eventDone: false
    };
  };

  CORE.regenerateDaily = function (state, dayKey) {
    var day = CORE.generateDay(state, dayKey);
    /* 保留已完成的条目 */
    var done = (state.day && state.day.quests || []).filter(function (q) { return q.done; });
    day.quests = done.concat(day.quests.filter(function (q) {
      return !done.some(function (d) { return d.kind === q.kind && (d.familyId || d.microId || d.eventId) === (q.familyId || q.microId || q.eventId); });
    }));
    state.day = day;
    return day;
  };

  /* ---------------- 残渣 ---------------- */

  CORE.residueCurrent = function (r, now) {
    now = now || Date.now();
    var hours = Math.max(0, (now - r.createdAt) / 3600000);
    return r.intensity * Math.pow(0.5, hours / (r.halfLifeH || 24));
  };

  CORE.residueList = function (state, now) {
    now = now || Date.now();
    return state.residue.map(function (r) {
      return { r: r, current: CORE.residueCurrent(r, now) };
    }).filter(function (x) { return x.current >= 0.5; })
      .sort(function (a, b) { return b.current - a.current; });
  };

  CORE.residuePenalty = function (state, now) {
    var list = CORE.residueList(state, now);
    if (!list.length) return { mult: 1, max: 0, note: '' };
    var max = list[0].current;
    var d = CORE.diff(state);
    if (max >= d.residueHigh) return { mult: d.highPenalty, max: max, note: '高负载' };
    if (max >= d.residueMid) return { mult: d.midPenalty, max: max, note: '中负载' };
    return { mult: 1, max: max, note: '' };
  };

  CORE.addResidue = function (state, input, now) {
    now = now || Date.now();
    var r = {
      id: uid('r'),
      name: input.name,
      intensity: clamp(Number(input.intensity) || 5, 1, 10),
      halfLifeH: Number(input.halfLifeH) || 24,
      createdAt: now,
      urge: input.urge || '',
      verdict: input.verdict || 'delay',
      reason: input.reason || '',
      converted: false,
      source: input.source || 'settle'
    };
    state.residue.push(r);
    state.meta.counters.residues++;
    if (r.verdict === 'reject') state.meta.counters.rejected++;
    if (r.verdict === 'approve') state.meta.counters.approved++;
    return r;
  };

  /* ---------------- 数值结算 ---------------- */

  CORE.streakMult = function (state) {
    return 1 + 0.02 * Math.min(state.streak.current, 30);
  };

  CORE.equipBonus = function (state) {
    var total = 0;
    (state.loot.equipped || []).forEach(function (id) {
      var item = CORE.lootById(id);
      if (item) total += (CORE.LOOT_RARITY[item.rarity] || {}).bonus || 0;
    });
    return total;
  };

  CORE.skillBonus = function (state, domain) {
    var bonus = 0;
    var map = (root.CONTENT && root.CONTENT.skills) || [];
    map.forEach(function (n) {
      if (state.character.skills.indexOf(n.id) < 0) return;
      if (!n.buff) return;
      if (!n.buff.domain || n.buff.domain === domain) bonus += n.buff.mult || 0;
    });
    return bonus;
  };

  CORE.lootById = function (id) {
    var arr = (root.CONTENT && root.CONTENT.loot) || [];
    for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i];
    return null;
  };

  CORE.xpMultiplier = function (state, now) {
    var d = CORE.diff(state);
    var m = CORE.streakMult(state);
    m *= 1 + CORE.equipBonus(state);
    var rp = CORE.residuePenalty(state, now);
    m *= rp.mult;
    var pen = state.meta.breakPenaltyUntil ? parseDayKey(state.meta.breakPenaltyUntil) : null;
    if (pen && pen.getTime() >= parseDayKey(CORE.dayKeyOf(new Date(now), state.settings.resetHour)).getTime()) m *= d.breakPenalty;
    return { mult: m, residue: rp };
  };

  CORE.taskXp = function (state, quest, now) {
    var f = CORE.familyById(quest.familyId);
    var tier = f ? (f.tier || 1) : 1;
    var minutes = quest.minutes || 30;
    var base = 20 + tier * 18 + Math.min(minutes, 90) * 0.3;
    if (quest.kind === 'main') base *= 1.2;
    if (quest.kind === 'challenge') base *= 1.35;
    if (quest.kind === 'micro') base = 14 + tier * 4;
    var x = CORE.xpMultiplier(state, now);
    return Math.round(base * x.mult);
  };

  CORE.familyById = function (id) {
    var arr = (root.CONTENT && root.CONTENT.taskFamilies) || [];
    for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i];
    return null;
  };

  CORE.microById = function (id) {
    var arr = (root.CONTENT && root.CONTENT.micro) || [];
    for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i];
    return null;
  };

  CORE.eventById = function (id) {
    var arr = (root.CONTENT && root.CONTENT.events) || [];
    for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i];
    return null;
  };

  CORE.variantOf = function (quest) {
    var f = CORE.familyById(quest.familyId);
    if (!f) return null;
    var vs = f.variants || [];
    for (var i = 0; i < vs.length; i++) if (vs[i].id === quest.variantId) return vs[i];
    return CORE.selectVariant(f, {});
  };

  CORE.applyAttrGain = function (state, attr, base, kind) {
    if (!attr) return 0;
    var cur = state.character.attrs[attr] || 5;
    var g = attrGain(cur, base);
    if (kind === 'main') g = round1(g * 1.25);
    if (kind === 'challenge') g = round1(g * 1.5);
    if (kind === 'micro') g = round1(g * 0.35);
    state.character.attrs[attr] = clamp(round1(cur + g), 1, 99);
    return round1(state.character.attrs[attr] - cur);
  };

  CORE.completeQuest = function (state, quest, input, now) {
    now = now || Date.now();
    var result = {
      xp: 0, deltas: {}, loot: null, levelUp: false, rankUp: false,
      converted: 0, convBonus: 0, allClear: false, settled: false,
      controlBefore: CORE.controlIndex(state), controlAfter: 0
    };
    if (quest.done) return result;

    var xp = CORE.taskXp(state, quest, now);
    var f = CORE.familyById(quest.familyId);
    var deltas = {};

    /* 属性结算：主属性 + 副属性 */
    if (f) {
      deltas[f.attr] = CORE.applyAttrGain(state, f.attr, 0.55 + (f.tier || 1) * 0.3, quest.kind);
      if (f.secondary) {
        deltas[f.secondary] = CORE.applyAttrGain(state, f.secondary, 0.3 + (f.tier || 1) * 0.15, quest.kind);
      }
    }
    if (quest.kind === 'micro') {
      var mic = CORE.microById(quest.microId);
      if (mic && mic.attr) deltas[mic.attr] = CORE.applyAttrGain(state, mic.attr, 0.25, 'micro');
    }

    /* 残渣转化：24 小时内完成任务，消散 2 点并返还 XP */
    var conv = 0, convBonus = 0;
    var rl = CORE.residueList(state, now);
    rl.forEach(function (x) {
      if (x.r.converted) return;
      if (now - x.r.createdAt > 24 * 3600000) return;
      if (conv >= 2) return;
      var before = CORE.residueCurrent(x.r, now);
      x.r.intensity = Math.max(0, round1(x.r.intensity - 2));
      x.r.converted = true;
      x.r.convertedAt = now;
      conv++;
      convBonus += Math.round(xp * 0.1);
    });
    state.meta.counters.converted += conv;

    xp += convBonus;

    var beforeLevel = state.character.level;
    var beforeRank = CORE.rankOf(beforeLevel).name;
    state.character.xp += xp;
    state.character.level = CORE.levelFromXp(state.character.xp);
    state.character.title = CORE.rankOf(state.character.level).name;
    result.levelUp = state.character.level > beforeLevel;
    result.rankUp = CORE.rankOf(state.character.level).name !== beforeRank;

    /* 登录 / 连击 / 全清 */
    var dayKey = CORE.dayKeyOf(new Date(now), state.settings.resetHour);
    if (state.day && state.day.key === dayKey) {
      quest.done = true;
      quest.ts = now;
      if (!state.day.settled) {
        state.day.settled = true;
        state.streak.lastSettled = dayKey;
        state.streak.current = state.streak.current + 1;
        state.streak.best = Math.max(state.streak.best, state.streak.current);
        state.meta.counters.settledDays++;
        result.settled = true;
      }
      var real = state.day.quests.filter(function (q) { return q.kind !== 'event'; });
      var allClear = real.length > 0 && real.every(function (q) { return q.done; });
      if (allClear && !state.day.allClear) {
        state.day.allClear = true;
        state.meta.counters.allClearDays++;
        state.inventory.points += 3;
        state.entropy = clamp(state.entropy - 10, 0, 100);
        result.allClear = true;
      }
    }
    result.xp = xp;
    result.deltas = deltas;
    result.converted = conv;
    result.convBonus = convBonus;

    /* 掉落 */
    var rng = mulberry32(hashStr(String(now) + '|' + state.loot.totalRolls));
    var chance = quest.kind === 'challenge' ? 0.55 : quest.kind === 'main' ? 0.45 : 0.3;
    if (quest.kind === 'micro') chance = 0.08;
    if (rng() < chance || result.allClear) {
      result.loot = CORE.rollLoot(state, rng);
    }
    state.loot.totalRolls++;

    /* 日志 */
    var log = {
      id: uid('l'),
      dayKey: dayKey,
      kind: quest.kind,
      familyId: quest.familyId || null,
      microId: quest.microId || null,
      eventId: quest.eventId || null,
      title: f ? f.title : (quest.kind === 'micro' ? '微训练' : '事件'),
      obs: input.obs || '',
      hypo: input.hypo || '',
      action: input.action || '',
      evidence: input.evidence || '',
      report: input.report || '',
      deltas: deltas,
      xp: xp,
      lootId: result.loot ? result.loot.item.id : null,
      protocol: input.protocol || '',
      feasibility: input.feasibility || 0,
      ts: now
    };
    state.logs.push(log);
    state.meta.counters.tasks++;

    if (log.protocol) {
      state.protocols.push({ id: uid('p'), text: log.protocol, createdAt: now, uses: 0 });
    }
    if (input.feasibility && input.feasibility < 3) {
      if (quest.familyId) state.feedback.lowRated.push({ familyId: quest.familyId, variantId: quest.variantId, score: input.feasibility, ts: now });
    }

    result.controlAfter = CORE.controlIndex(state);
    result.logId = log.id;
    state.updatedAt = now;
    return result;
  };

  /* ---------------- 掉落 ---------------- */

  CORE.rollLoot = function (state, rng) {
    rng = rng || Math.random;
    var d = CORE.diff(state);
    var weights = {
      common: CORE.LOOT_RARITY.common.weight,
      rare: CORE.LOOT_RARITY.rare.weight,
      epic: CORE.LOOT_RARITY.epic.weight,
      legendary: d.lootLegend
    };
    var total = 0, k;
    for (k in weights) total += weights[k];
    var r = rng() * total, rarity = 'common';
    for (k in weights) { r -= weights[k]; if (r <= 0) { rarity = k; break; } }
    state.loot.pity++;
    if (state.loot.pity >= 40) { rarity = 'legendary'; }
    if (rarity === 'legendary') state.loot.pity = 0;
    var pool = ((root.CONTENT && root.CONTENT.loot) || []).filter(function (x) { return x.rarity === rarity; });
    if (!pool.length) pool = ((root.CONTENT && root.CONTENT.loot) || []);
    if (!pool.length) return null;
    var item = pool[Math.floor(rng() * pool.length)];
    var owned = state.loot.owned[item.id] || 0;
    var dup = owned > 0;
    if (dup) {
      state.loot.shards += CORE.LOOT_RARITY[rarity].shards;
    } else {
      state.loot.owned[item.id] = 1;
    }
    state.meta.counters = state.meta.counters || {};
    return { item: item, dup: dup, shards: dup ? CORE.LOOT_RARITY[rarity].shards : 0 };
  };

  /* ---------------- 掌控度 / 形态 ---------------- */

  CORE.controlIndex = function (state) {
    var sum = 0;
    CORE.ATTRS.forEach(function (a) { sum += (state.character.attrs[a.id] || 5) / 99; });
    var avg = sum / CORE.ATTRS.length;
    var streak = Math.min(state.streak.current, 30) / 30;
    var c = state.meta.counters;
    var conv = c.residues ? c.converted / c.residues : 0;
    var ac = c.settledDays ? Math.min(c.allClearDays / Math.max(1, Math.min(c.settledDays, 30)), 1) : 0;
    return Math.round(clamp(0.35 * avg + 0.25 * streak + 0.2 * conv + 0.2 * ac, 0, 1) * 100);
  };

  CORE.formCompletion = function (state) {
    var pct = 0, total = 0;
    CORE.ATTRS.forEach(function (a) {
      var t = state.character.target[a.id] || 80;
      var cur = state.character.attrs[a.id] || 5;
      pct += Math.min(cur / t, 1);
      total += 1;
    });
    var attrPct = total ? pct / total : 0;
    var ms = (root.CONTENT && root.CONTENT.milestones) || [];
    var got = ms.filter(function (m) { return state.character.milestones[m.id]; }).length;
    var msPct = ms.length ? got / ms.length : 0;
    return Math.round(clamp(attrPct * 0.8 + msPct * 0.2, 0, 1) * 100);
  };

  /* ---------------- 技能解锁 ---------------- */

  CORE.checkSkills = function (state) {
    var nodes = (root.CONTENT && root.CONTENT.skills) || [];
    var unlocked = [];
    nodes.forEach(function (n) {
      if (state.character.skills.indexOf(n.id) >= 0) return;
      var ok = true;
      if (n.req) {
        if (n.req.attr && (state.character.attrs[n.req.attr] || 0) < n.req.value) ok = false;
        if (n.req.tasks && state.meta.counters.tasks < n.req.tasks) ok = false;
        if (n.req.streak && state.streak.current < n.req.streak) ok = false;
        if (n.req.level && state.character.level < n.req.level) ok = false;
      }
      if (ok) {
        state.character.skills.push(n.id);
        unlocked.push(n);
      }
    });
    return unlocked;
  };

  /* ---------------- 断链 / 惰性 / 每日对账 ---------------- */

  CORE.reconcile = function (state, now) {
    now = now || Date.now();
    var events = [];
    var resetHour = state.settings.resetHour;
    var today = dayKeyOf(new Date(now), resetHour);

    if (!state.day) {
      state.day = CORE.generateDay(state, today);
      state.meta.lastSeenDay = today;
    } else if (state.day.key !== today) {
      var gap = Math.max(1, daysBetween(state.day.key, today));
      if (!state.day.settled) {
        var d = CORE.diff(state);
        var lost = state.streak.current;
        state.streak.current = 0;
        state.entropy = clamp(state.entropy + d.idleEntropy * Math.min(gap, 7), 0, 100);
        if (lost > 0) {
          state.meta.breakPenaltyUntil = CORE.shiftDay(today, d.breakPenaltyDays - 1);
          events.push({ type: 'missed', text: '昨日未结算：连击清零（原 ' + lost + '），惰性 +' + d.idleEntropy });
        }
      } else if (gap > 1) {
        state.entropy = clamp(state.entropy + CORE.diff(state).idleEntropy * (gap - 1), 0, 100);
        events.push({ type: 'idle', text: '已 ' + (gap - 1) + ' 天未记录，惰性上升' });
      }
      state.day = CORE.generateDay(state, today);
      state.meta.lastSeenDay = today;
      events.push({ type: 'newday', text: '新的一天，任务已刷新' });
    }

    /* 连击保护：超过 1 天没续且前一天未结算，已在上面处理 */
    /* 残渣清理 */
    state.residue = state.residue.filter(function (r) {
      return CORE.residueCurrent(r, now) >= 0.5;
    });

    /* Boss */
    var wk = weekKeyOf(today);
    if (!state.boss || state.boss.weekKey !== wk) {
      var bosses = (root.CONTENT && root.CONTENT.bosses) || [];
      if (bosses.length) {
        var idx = hashStr(wk + state.character.codename) % bosses.length;
        state.boss = { weekKey: wk, id: bosses[idx].id, status: 'open', evidence: '', completedAt: 0 };
      }
    }

    /* 赛季 */
    if (!state.season.startKey) state.season.startKey = today;
    var elapsed = Math.max(0, daysBetween(state.season.startKey, today));
    var newIndex = Math.floor(elapsed / 28) + 1;
    if (newIndex > state.season.index) {
      state.season.history.push({ index: state.season.index, score: state.season.score, at: now });
      var prev = state.season.score || 0;
      state.season.index = newIndex;
      state.season.startKey = CORE.shiftDay(today, -(elapsed % 28));
      state.season.score = 0;
      state.season.shadow = Math.round(prev * 1.1);
      state.inventory.points += 5;
      events.push({ type: 'season', text: '新赛季开始，影子对手分数 ' + state.season.shadow });
    }

    /* 状态报告影响：睡眠 < 6 或残渣过高 → 过载 */
    var high = CORE.residuePenalty(state, now);
    if (state.day.report && state.day.report.sleep < 6 && high.max < 7) {
      state.day.overload = true;
    }

    /* 技能解锁 */
    var unlocked = CORE.checkSkills(state);
    if (unlocked.length) events.push({ type: 'skill', text: '解锁技能：' + unlocked.map(function (x) { return x.name; }).join('、'), skills: unlocked });

    state.meta.lastSeenAt = now;
    state.updatedAt = now;
    return events;
  };

  CORE.shiftDay = function (dayKey, delta) {
    var d = parseDayKey(dayKey);
    d.setDate(d.getDate() + delta);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  };

  /* ---------------- 仪式 / 经验 ---------------- */

  CORE.dailyReportXp = function (state) {
    var r = (state.day && state.day.report) || {};
    var xp = 0;
    if (r.sleep >= 7) xp += 5;
    if (r.energy >= 3) xp += 5;
    if (r.load <= 5) xp += 5;
    return xp;
  };

  /* ---------------- Lint ---------------- */

  var FIRST_PERSON = ['我觉得', '我感觉', '我感到', '我认为', '我想要', '我应该', '为什么我', '我是不是', '我好', '我真', '我太', '我很难', '我受不了', '我委屈', '我生气', '我焦虑', '我害怕'];
  var EMOTION_WORDS = ['难受', '崩溃', '委屈', '生气', '愤怒', '焦虑', '害怕', '丢人', '羞耻', '失败', '受不了', '想哭', '烦死', '痛苦', '绝望', '内耗'];

  CORE.lintObs = function (text) {
    text = String(text || '');
    var hits = [];
    FIRST_PERSON.forEach(function (t) {
      var i = text.indexOf(t);
      if (i >= 0) hits.push({ type: 'first', text: t, index: i });
    });
    var re = /我(?!们)/g, m;
    while ((m = re.exec(text))) {
      if (!hits.some(function (h) { return h.index === m.index; })) hits.push({ type: 'first', text: '我', index: m.index });
    }
    EMOTION_WORDS.forEach(function (t) {
      var i = text.indexOf(t);
      if (i >= 0) hits.push({ type: 'emotion', text: t, index: i });
    });
    var seen = {};
    hits = hits.filter(function (h) { var k = h.type + h.text + h.index; if (seen[k]) return false; seen[k] = 1; return true; });
    return { ok: hits.length === 0, hits: hits, length: text.length };
  };

  CORE.lintHypo = function (text) {
    text = String(text || '').trim();
    var ok = /^假设[：:]/.test(text) && /可能|或许|一种解释|推测|也许/.test(text);
    return { ok: ok, length: text.length };
  };

  CORE.lintReport = function (text, codename) {
    text = String(text || '').trim();
    var hits = [];
    if (codename && text.indexOf(codename) < 0) hits.push({ type: 'codename', text: '缺少代号' });
    if (/我(?!们)/.test(text)) hits.push({ type: 'first', text: '出现第一人称' });
    return { ok: hits.length === 0, hits: hits };
  };

  CORE.buildReport = function (state, quest, input) {
    var f = CORE.familyById(quest.familyId);
    var title = f ? f.title : (quest.kind === 'micro' ? '微训练' : '事件');
    var code = state.character.codename;
    var action = String(input.action || '').trim() || '执行了既定动作';
    var obs = String(input.obs || '').trim();
    var evidence = String(input.evidence || '').trim();
    var verdict = '';
    if (input.verdict === 'reject') verdict = '驳回一条冲动';
    else if (input.verdict === 'delay') verdict = '将一条冲动延后';
    else if (input.verdict === 'approve') verdict = '批准一条冲动';
    function sent(x) {
      var s = String(x || '').trim().replace(/[。．.!！?？;；,，\s]+$/, '');
      return s ? s + '。' : '';
    }
    var parts = [sent(code + ' 在「' + title + '」中' + action)];
    if (obs) parts.push(sent('观测：' + obs));
    if (evidence) parts.push(sent('证据：' + evidence));
    if (verdict) parts.push(sent(verdict));
    return parts.filter(Boolean).join('');
  };

  /* ---------------- 事件卡 ---------------- */

  CORE.applyEvent = function (state, event, optionIndex, now) {
    now = now || Date.now();
    var opt = event.options[optionIndex];
    var res = { xp: opt.xp || 0, deltas: {}, outcome: opt.outcome || '', loot: null };
    if (opt.deltas) {
      Object.keys(opt.deltas).forEach(function (k) {
        var g = CORE.applyAttrGain(state, k, Math.abs(opt.deltas[k]) * 0.3, 'daily');
        if (opt.deltas[k] < 0) { state.character.attrs[k] = clamp(state.character.attrs[k] + opt.deltas[k], 1, 99); g = opt.deltas[k]; }
        res.deltas[k] = g;
      });
    }
    state.character.xp += res.xp;
    state.character.level = CORE.levelFromXp(state.character.xp);
    state.character.title = CORE.rankOf(state.character.level).name;
    var q = (state.day.quests || []).find(function (x) { return x.kind === 'event'; });
    if (q) { q.done = true; q.ts = now; }
    state.logs.push({
      id: uid('l'), dayKey: CORE.dayKeyOf(new Date(now), state.settings.resetHour),
      kind: 'event', eventId: event.id, title: event.title, obs: event.text,
      action: opt.label, report: opt.outcome, deltas: res.deltas, xp: res.xp, ts: now
    });
    state.updatedAt = now;
    return res;
  };

  /* ---------------- Boss ---------------- */

  CORE.bossById = function (id) {
    var arr = (root.CONTENT && root.CONTENT.bosses) || [];
    for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i];
    return null;
  };

  CORE.completeBoss = function (state, evidence, now) {
    now = now || Date.now();
    if (!state.boss || state.boss.status === 'done') return null;
    var b = CORE.bossById(state.boss.id);
    if (!b) return null;
    state.boss.status = 'done';
    state.boss.evidence = evidence || '';
    state.boss.completedAt = now;
    state.character.xp += b.xp || 150;
    state.character.level = CORE.levelFromXp(state.character.xp);
    state.character.title = CORE.rankOf(state.character.level).name;
    if (b.attr) CORE.applyAttrGain(state, b.attr, 1.2, 'main');
    state.inventory.points += 10;
    var rng = mulberry32(hashStr('boss' + now));
    var loot = CORE.rollLoot(state, rng);
    state.logs.push({
      id: uid('l'), dayKey: CORE.dayKeyOf(new Date(now), state.settings.resetHour),
      kind: 'boss', title: 'BOSS · ' + b.name, obs: evidence || '', action: '完成周 Boss',
      report: b.name + ' 已完成', deltas: b.attr ? { [b.attr]: 1.2 } : {}, xp: b.xp || 150, lootId: loot ? loot.item.id : null, ts: now
    });
    state.updatedAt = now;
    return { boss: b, loot: loot, xp: b.xp || 150 };
  };

  /* ---------------- 赛季影子 ---------------- */

  CORE.seasonScore = function (state) {
    var start = state.season.startKey;
    if (!start) return 0;
    var total = 0;
    state.logs.forEach(function (l) {
      if (l.dayKey && daysBetween(start, l.dayKey) >= 0 && daysBetween(start, l.dayKey) < 28) total += l.xp || 0;
    });
    return total;
  };

  /* ---------------- 存档 ---------------- */

  CORE.serialize = function (state) { return JSON.stringify(state); };

  CORE.deserialize = function (json) {
    var raw = typeof json === 'string' ? JSON.parse(json) : json;
    return CORE.normalizeState(raw);
  };

  /* ---------------- 统计 ---------------- */

  CORE.weekStats = function (state, now) {
    now = now || Date.now();
    var today = dayKeyOf(new Date(now), state.settings.resetHour);
    var start = CORE.shiftDay(today, -6);
    var logs = state.logs.filter(function (l) { return l.dayKey && daysBetween(start, l.dayKey) >= 0 && daysBetween(start, l.dayKey) <= 6; });
    var byDay = {};
    for (var i = 0; i < 7; i++) {
      var k = CORE.shiftDay(start, i);
      byDay[k] = { xp: 0, tasks: 0 };
    }
    var xp = 0, tasks = logs.length;
    logs.forEach(function (l) {
      xp += l.xp || 0;
      if (byDay[l.dayKey]) byDay[l.dayKey].xp += l.xp || 0;
      if (byDay[l.dayKey]) byDay[l.dayKey].tasks++;
    });
    var residue = state.residue.filter(function (r) { return now - r.createdAt < 7 * 86400000; });
    var converted = residue.filter(function (r) { return r.converted; }).length;
    return {
      xp: xp, tasks: tasks, byDay: byDay,
      conversion: residue.length ? Math.round(converted / residue.length * 100) : 0,
      rejected: state.meta.counters.rejected,
      logs: logs
    };
  };

  /* ---------------- 目标 / 里程碑 ---------------- */

  CORE.milestonePct = function (state) {
    var ms = (root.CONTENT && root.CONTENT.milestones) || [];
    if (!ms.length) return 0;
    var got = ms.filter(function (m) { return state.character.milestones[m.id]; }).length;
    return Math.round(got / ms.length * 100);
  };

  /* ---------------- 表单 / 快速记录 ---------------- */

  CORE.quickLog = function (state, input, now) {
    now = now || Date.now();
    var r = CORE.addResidue(state, {
      name: input.name, intensity: input.intensity, halfLifeH: input.halfLifeH,
      urge: input.urge, verdict: input.verdict, reason: input.reason, source: 'quick'
    }, now);
    state.logs.push({
      id: uid('l'), dayKey: CORE.dayKeyOf(new Date(now), state.settings.resetHour),
      kind: 'quick', title: '现场记录', obs: input.obs || '', action: input.action || '',
      report: '', deltas: {}, xp: 8, ts: now
    });
    state.character.xp += 8;
    state.character.level = CORE.levelFromXp(state.character.xp);
    state.character.title = CORE.rankOf(state.character.level).name;
    state.updatedAt = now;
    return r;
  };

  CORE.randomCodename = function (rng) {
    var pool = (root.CONTENT && root.CONTENT.codenames) || ['V-07'];
    return pick(pool, rng || Math.random);
  };

  root.CORE = CORE;
})(typeof globalThis !== 'undefined' ? globalThis : this);
