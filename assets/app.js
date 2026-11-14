/* 载体协议 VESSEL — UI */
(function () {
  'use strict';

  var KEY = 'vessel.v1';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function attrName(id) { var a = CORE.ATTR_MAP[id]; return a ? a.name : id; }
  function domainName(id) { for (var i = 0; i < CORE.DOMAINS.length; i++) if (CORE.DOMAINS[i].id === id) return CORE.DOMAINS[i].name; return id; }
  function kindName(k) { return { main: '主线', daily: '日常', challenge: '挑战', micro: '微训练', event: '事件', quick: '现场', boss: 'BOSS' }[k] || k; }
  function round1(n) { return Math.round(n * 10) / 10; }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function fmtTime(ts) { var d = new Date(ts); return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  function todayKey() { return CORE.dayKeyOf(new Date(), S.settings.resetHour); }

  var S = null;
  var UI = { tab: 'panel', onb: null, wiz: null, focusTimer: null, installPrompt: null, sheetClose: null };

  /* ---------------- 持久化 ---------------- */
  function loadState() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return CORE.deserialize(raw);
    } catch (e) {
      try { localStorage.setItem(KEY + '.broken.' + Date.now(), localStorage.getItem(KEY)); } catch (e2) {}
      return null;
    }
  }
  function save() {
    if (!S) return;
    S.updatedAt = Date.now();
    try { localStorage.setItem(KEY, CORE.serialize(S)); } catch (e) { toast('存档失败：存储空间不足', 'bad'); }
  }

  /* ---------------- Toast / 震动 ---------------- */
  var toastTimer = null;
  function toast(msg, kind) {
    var el = $('#toast');
    el.textContent = msg;
    el.className = 'toast ' + (kind || '');
    el.classList.remove('is-hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.add('is-hidden'); }, 2600);
  }
  function vibrate(pattern) {
    if (S && S.settings.haptics && navigator.vibrate) { try { navigator.vibrate(pattern || 12); } catch (e) {} }
  }
  function beep(freq, dur) {
    if (S && S.settings.sound === false) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      UI.ac = UI.ac || new AC();
      var o = UI.ac.createOscillator(), g = UI.ac.createGain();
      o.type = 'sine'; o.frequency.value = freq || 660;
      g.gain.value = 0.05;
      o.connect(g); g.connect(UI.ac.destination);
      o.start(); o.stop(UI.ac.currentTime + (dur || 0.12));
    } catch (e) {}
  }

  /* ---------------- 启动 ---------------- */
  function boot() {
    S = loadState();
    setTimeout(function () { $('#boot').classList.add('out'); }, 420);
    setTimeout(function () {
      $('#boot').classList.add('is-hidden');
      if (!S || !S.meta.onboarded) {
        renderOnboarding();
      } else {
        startApp();
      }
    }, 820);
  }

  function startApp() {
    $('#app').classList.remove('is-hidden');
    var before = S.meta.lastSeenDay;
    var events = CORE.reconcile(S, Date.now());
    var changed = S.day && S.day.key !== before;
    save();
    render();
    bindGlobal();
    events.forEach(function (e) { toast(e.text, e.type === 'missed' ? 'bad' : e.type === 'season' ? 'amber' : 'good'); });
    if (changed && S.character.xp > 0 && S.meta.takeoverDay !== S.day.key) {
      S.meta.takeoverDay = S.day.key; save(); showTakeover();
    }
    if (S.day && S.day.overload) setTimeout(function () { toast('检测到过载：今日只保留 1 条任务即可。', 'amber'); }, 1200);
  }

  function showTakeover() {
    var el = $('#takeover');
    var creed = (CONTENT.creeds[(S.streak.current + S.character.level) % CONTENT.creeds.length] || {}).text || '';
    el.innerHTML = '<div class="tk-k">VESSEL PROTOCOL</div>' +
      '<div class="tk-id">' + esc(S.character.codename) + '</div>' +
      '<div class="tk-line">' + esc(creed) + '</div>' +
      '<div class="tk-line" style="color:#5d6d80">载体接管中 · 今日协议已装载</div>' +
      '<div class="tk-bar"><i></i></div>';
    el.classList.remove('is-hidden');
    var done = false;
    function end() {
      if (done) return; done = true;
      el.classList.add('out');
      setTimeout(function () { el.classList.add('is-hidden'); el.classList.remove('out'); }, 380);
    }
    el.onclick = end;
    setTimeout(end, 2600);
    vibrate([10, 40, 10]);
  }

  /* ---------------- 顶栏 / 底栏 ---------------- */
  function renderTopbar() {
    var rank = CORE.rankOf(S.character.level).name;
    $('#topbar').innerHTML =
      '<div class="brand"><div class="brand-mark">V</div><div>' +
      '<div class="brand-id">' + esc(S.character.codename) + ' · ' + esc(rank) + '</div>' +
      '<div class="brand-sub">VESSEL PROTOCOL · LV ' + S.character.level + '</div></div></div>' +
      '<div class="top-right">' +
      '<div class="pill amber">🔥 <b>' + S.streak.current + '</b></div>' +
      '<div class="pill cyan">✦ <b>' + (S.inventory.points || 0) + '</b></div>' +
      '<button class="tab" data-act="settings" style="padding:4px 2px"><span class="ic" style="font-size:15px">⚙</span></button>' +
      '</div>';
  }

  var TABS = [
    { id: 'panel', name: '面板', ic: '◉' },
    { id: 'tasks', name: '任务', ic: '☰' },
    { id: 'shape', name: '形态', ic: '◎' },
    { id: 'log', name: '战报', ic: '▤' },
    { id: 'archive', name: '档案', ic: '▣' }
  ];
  function renderTabbar() {
    $('#tabbar').innerHTML = TABS.map(function (t) {
      return '<button class="tab ' + (UI.tab === t.id ? 'on' : '') + '" data-tab="' + t.id + '">' +
        '<span class="ic">' + t.ic + '</span><span>' + t.name + '</span></button>';
    }).join('');
  }

  function render() {
    if (!S || !S.meta.onboarded) return;
    renderTopbar();
    renderTabbar();
    var v = $('#view');
    if (UI.tab === 'panel') v.innerHTML = viewPanel();
    else if (UI.tab === 'tasks') v.innerHTML = viewTasks();
    else if (UI.tab === 'shape') v.innerHTML = viewShape();
    else if (UI.tab === 'log') v.innerHTML = viewLog();
    else v.innerHTML = viewArchive();
    bindActions(v);
    window.scrollTo(0, 0);
  }

  /* ---------------- 雷达 ---------------- */
  function radarSvg() {
    var cx = 103, cy = 103, R = 74;
    var n = CORE.ATTRS.length;
    var ang = function (i) { return (-90 + i * 360 / n) * Math.PI / 180; };
    var pt = function (i, r) { return (cx + Math.cos(ang(i)) * r).toFixed(1) + ',' + (cy + Math.sin(ang(i)) * r).toFixed(1); };
    var grid = '';
    [0.25, 0.5, 0.75, 1].forEach(function (f) {
      var pts = [];
      for (var i = 0; i < n; i++) pts.push(pt(i, R * f));
      grid += '<polygon class="grid" points="' + pts.join(' ') + '"/>';
    });
    var axes = '', labels = '', dots = '', poly = [], target = [];
    CORE.ATTRS.forEach(function (a, i) {
      var p = pt(i, R), p2 = pt(i, R + 11);
      axes += '<line class="axis" x1="' + cx + '" y1="' + cy + '" x2="' + p.split(',')[0] + '" y2="' + p.split(',')[1] + '"/>';
      var lx = cx + Math.cos(ang(i)) * (R + 21), ly = cy + Math.sin(ang(i)) * (R + 21);
      var anchor = Math.abs(Math.cos(ang(i))) < 0.2 ? 'middle' : (Math.cos(ang(i)) > 0 ? 'start' : 'end');
      labels += '<text x="' + lx.toFixed(1) + '" y="' + (ly + 2.2).toFixed(1) + '" text-anchor="' + anchor + '">' + esc(a.name) + '</text>';
      var v = S.character.attrs[a.id] || 5;
      poly.push(pt(i, Math.max(4, R * v / 99)));
      target.push(pt(i, Math.max(4, R * (S.character.target[a.id] || 80) / 99)));
      var dp = pt(i, Math.max(4, R * v / 99)).split(',');
      dots += '<circle class="dot" cx="' + dp[0] + '" cy="' + dp[1] + '" r="1.6"/>';
    });
    return '<svg class="radar" viewBox="0 0 206 206">' + grid + axes +
      '<polygon class="poly2" points="' + target.join(' ') + '"/>' +
      '<polygon class="poly" points="' + poly.join(' ') + '"/>' + dots + labels + '</svg>';
  }

  /* ---------------- 面板 ---------------- */
  function viewPanel() {
    var c = S.character;
    var need = CORE.needXp(c.level);
    var into = c.xp - CORE.totalXpForLevel(c.level);
    var pct = Math.min(100, Math.round(into / need * 100));
    var ctrl = CORE.controlIndex(S);
    var form = CORE.formCompletion(S);
    var stage = CORE.stageOf(form);
    var res = CORE.residueList(S);
    var creed = CONTENT.creeds[(S.streak.current + new Date().getDate()) % CONTENT.creeds.length];
    var done = S.day.quests.filter(function (q) { return q.done; }).length;
    var total = S.day.quests.filter(function (q) { return q.kind !== 'event'; }).length;
    var realDone = S.day.quests.filter(function (q) { return q.done && q.kind !== 'event'; }).length;

    var domainRows = CORE.DOMAINS.map(function (d) {
      var vals = d.attrs.map(function (a) { return c.attrs[a] || 5; });
      var tg = d.attrs.map(function (a) { return c.target[a] || 80; });
      var avg = vals.reduce(function (x, y) { return x + y; }, 0) / vals.length;
      var tavg = tg.reduce(function (x, y) { return x + y; }, 0) / tg.length;
      return '<div class="rside"><div><div>' + d.name + ' <span class="sub">' + Math.round(avg) + ' / ' + Math.round(tavg) + '</span></div>' +
        '<div class="t"><i style="width:' + Math.min(100, avg / 99 * 100) + '%;background:' + d.color + '"></i></div></div>' +
        '<b style="color:' + d.color + '">' + Math.round(avg) + '</b></div>';
    }).join('');

    var questRows = S.day.quests.slice(0, 6).map(function (q) {
      var info = questInfo(q);
      return '<div class="row"><div class="grow"><div>' + esc(info.title) + '</div>' +
        '<div class="sub">' + kindName(q.kind) + ' · ' + info.minutes + 'min · +' + CORE.taskXp(S, q, Date.now()) + ' XP</div></div>' +
        (q.done ? '<span class="badge" style="color:#4ade80;border-color:rgba(74,222,128,.35)">✓</span>' :
          '<button class="btn sm primary" data-act="settle" data-id="' + q.id + '">结算</button>') + '</div>';
    }).join('');

    var boss = currentBoss();
    var bossHtml = boss ? '<div class="card"><div class="card-h"><div class="card-t strong">周 BOSS</div><span class="badge">' + (S.boss.status === 'done' ? '已完成' : '待挑战') + '</span></div>' +
      '<div style="font-size:15px;font-weight:700">' + esc(boss.name) + '</div><div class="small mt8">' + esc(boss.desc) + '</div>' +
      (S.boss.status === 'done' ? '' : '<button class="btn amber sm block mt12" data-act="boss">提交证据</button>') + '</div>' : '';

    return '<div class="card hero glow">' +
      '<div class="hero-top"><div><div class="hero-name">' + esc(c.codename) + '</div>' +
      '<div class="hero-rank">' + esc(CORE.rankOf(c.level).name) + ' · ' + esc(stage.name) + '</div></div>' +
      '<div class="hero-lv"><b>' + c.level + '</b><span>LEVEL</span></div></div>' +
      '<div class="xpbar"><i style="width:' + pct + '%"></i></div>' +
      '<div class="xpmeta"><span>XP ' + c.xp + '</span><span>' + into + ' / ' + need + '</span></div>' +
      '<div class="hero-stats">' +
      '<div class="hstat"><b style="color:var(--amber)">' + S.streak.current + '</b><span>连击</span></div>' +
      '<div class="hstat"><b style="color:var(--cyan)">' + ctrl + '%</b><span>掌控</span></div>' +
      '<div class="hstat"><b style="color:var(--violet)">' + form + '%</b><span>形态</span></div>' +
      '<div class="hstat"><b style="color:' + (res.length ? 'var(--red)' : 'var(--green)') + '">' + res.length + '</b><span>残渣</span></div>' +
      '</div>' +
      '<div class="hero-quote"><i>◈</i><div>' + esc(creed.text) + '</div></div>' +
      '</div>' +

      '<div class="card"><div class="card-h"><div class="card-t">载体控制</div><span class="card-link" data-act="tab" data-id="shape">形态 ›</span></div>' +
      '<div class="formbars"><div class="fbar"><span>控制指数</span><div class="track"><i style="width:' + ctrl + '%;background:linear-gradient(90deg,#1aa8d6,#4fd7ff)"></i></div><b>' + ctrl + '</b></div>' +
      '<div class="fbar"><span>形态完成</span><div class="track"><i style="width:' + form + '%;background:linear-gradient(90deg,#7c6cf0,#b18cff)"></i></div><b>' + form + '</b></div></div>' +
      '<div class="small mt8">目标：' + esc(c.targetName || '高阶 INTJ · 优雅高管') + ' · 阶段：' + esc(stage.name) + '</div></div>' +

      '<div class="card"><div class="card-h"><div class="card-t">属性雷达</div><span class="card-link" data-act="tab" data-id="shape">全部 ›</span></div>' +
      '<div class="radar-wrap">' + radarSvg() + '<div class="radar-side">' + domainRows + '</div></div></div>' +

      '<div class="card"><div class="card-h"><div class="card-t strong">今日协议</div><span class="card-link" data-act="tab" data-id="tasks">' +
      realDone + '/' + total + ' ›</span></div>' + (questRows || '<div class="empty">今日协议生成中</div>') +
      '<button class="btn primary block mt8" data-act="tab" data-id="tasks">进入任务面板</button></div>' +

      bossHtml +
      '<div class="card"><div class="card-h"><div class="card-t">情报</div><span class="card-link" data-act="intel-add">＋</span></div>' +
      (S.intel.length ? S.intel.slice(-3).reverse().map(function (it) {
        return '<div class="row"><div class="grow"><div>' + esc(it.title) + '</div><div class="sub">' + esc(it.note || it.source || '') + '</div></div><span class="val">' + fmtTime(it.ts) + '</span></div>';
      }).join('') : '<div class="empty">收集可验证的情报，而不是道听途说。</div>') + '</div>';
  }

  /* ---------------- 任务 ---------------- */
  function viewTasks() {
    var qs = S.day.quests;
    var real = qs.filter(function (q) { return q.kind !== 'event'; });
    var done = real.filter(function (q) { return q.done; }).length;
    var report = S.day.report || {};
    var eventQ = qs.filter(function (q) { return q.kind === 'event'; })[0];
    var ev = eventQ ? CORE.eventById(eventQ.eventId) : null;

    var html = '<div class="card"><div class="card-h"><div class="card-t strong">今日协议</div><span class="card-link" data-act="reroll">换牌 ⟳</span></div>' +
      '<div style="display:flex;align-items:baseline;gap:8px"><div style="font-size:30px;font-weight:800;color:var(--cyan)">' + done + '</div>' +
      '<div style="color:var(--dim);font-size:11px">/ ' + real.length + ' 条非事件任务 · XP 倍率 ×' + round1(CORE.xpMultiplier(S, Date.now()).mult * 10) / 10 + '</div></div>' +
      '<div class="xpbar mt8"><i style="width:' + (real.length ? done / real.length * 100 : 0) + '%"></i></div>' +
      (S.day.settled ? '<div class="small mt8" style="color:var(--green)">今日已结算 · 连击 ' + S.streak.current + ' 天</div>' : '<div class="small mt8" style="color:var(--amber)">完成任意一条任务即视为今日结算，可保住连击。</div>') +
      '</div>' +

      '<div class="card"><div class="card-h"><div class="card-t">载体状态报告</div><span class="badge">影响 XP 判定</span></div>' +
      '<div class="small mb8">不写感受，只填数字。睡眠不足 6h 会触发过载保护。</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
      fieldNum('rp_sleep', '睡眠(h)', report.sleep, 0, 14, 1) +
      fieldNum('rp_load', '负荷(1-5)', report.load, 1, 5, 1) +
      fieldNum('rp_energy', '精力(1-5)', report.energy, 1, 5, 1) +
      fieldNum('rp_pain', '疼痛(0-3)', report.pain, 0, 3, 1) +
      '</div><button class="btn sm block mt8" data-act="report-save">保存状态</button></div>';

    html += qs.map(questCard).join('');

    if (ev) {
      html += '<div class="quest main"><div class="q-head"><span class="q-kind event">事件</span><span class="q-time">' + (eventQ.done ? '已处理' : '今日随机') + '</span></div>' +
        '<div class="q-title">' + esc(ev.title) + '</div><div class="q-goal">' + esc(ev.text) + '</div>' +
        (eventQ.done ? '' : '<button class="btn amber block" data-act="event" data-id="' + eventQ.id + '">处理事件</button>') + '</div>';
    }

    var boss = currentBoss();
    if (boss) {
      html += '<div class="quest challenge"><div class="q-head"><span class="q-kind challenge">BOSS</span><span class="q-time">本周</span></div>' +
        '<div class="q-title">' + esc(boss.name) + '</div><div class="q-goal">' + esc(boss.desc) + '</div>' +
        '<div class="q-meta"><span>证据：' + esc(boss.evidence) + '</span><span>+' + boss.xp + ' XP</span></div>' +
        (S.boss.status === 'done' ? '<div class="small" style="color:var(--green)">已完成，证据：' + esc(S.boss.evidence || '—') + '</div>' :
          '<button class="btn amber block" data-act="boss">提交证据并结算</button>') + '</div>';
    }
    return html;
  }

  function fieldNum(id, label, val, min, max, step) {
    return '<div class="field" style="margin:0"><label>' + label + '</label><input class="input" id="' + id + '" type="number" min="' + min + '" max="' + max + '" step="' + step + '" value="' + (val == null ? '' : val) + '"></div>';
  }

  function questInfo(q) {
    if (q.kind === 'micro') {
      var m = CORE.microById(q.microId) || { action: '微训练', attr: 'wil', minutes: 5 };
      return { title: m.action, goal: '微训练 · ' + attrName(m.attr), action: m.action, evidence: '打卡即可', minutes: q.minutes || m.minutes, variant: '', comp: '', family: null, micro: m };
    }
    if (q.kind === 'event') {
      var e = CORE.eventById(q.eventId) || { title: '事件', text: '' };
      return { title: e.title, goal: e.text, action: '', evidence: '', minutes: 5, variant: '', comp: '', family: null, event: e };
    }
    var f = CORE.familyById(q.familyId);
    if (!f) return { title: '任务', goal: '', action: '', evidence: '', minutes: 30, variant: '', comp: '', family: null };
    var v = null;
    for (var i = 0; i < f.variants.length; i++) if (f.variants[i].id === q.variantId) v = f.variants[i];
    if (!v) v = CORE.selectVariant(f, S.calibration);
    return {
      title: f.title, goal: f.goal, action: v ? v.action : '', evidence: v ? v.evidence : '',
      minutes: (v && v.minutes) || f.minutes, variant: v ? v.label : '', comp: f.compliance || '', family: f
    };
  }

  function questCard(q) {
    var info = questInfo(q);
    var xp = CORE.taskXp(S, q, Date.now());
    var kindCls = q.kind === 'main' ? 'main' : q.kind === 'challenge' ? 'challenge' : q.kind === 'micro' ? 'micro' : '';
    return '<div class="quest ' + kindCls + (q.done ? ' done' : '') + '">' +
      '<div class="q-head"><span class="q-kind ' + kindCls + '">' + kindName(q.kind) + '</span>' +
      (info.variant ? '<span class="badge">' + esc(info.variant) + '</span>' : '') +
      '<span class="q-time">' + info.minutes + ' min · +' + xp + ' XP</span></div>' +
      '<div class="q-title">' + esc(info.title) + '</div>' +
      '<div class="q-goal">' + esc(info.goal) + '</div>' +
      '<div class="q-action">' + esc(info.action) + '</div>' +
      '<div class="q-meta"><span>证据：' + esc(info.evidence) + '</span>' + (info.family ? '<span>' + esc(domainName(info.family.domain)) + ' · ' + esc(attrName(info.family.attr)) + '</span>' : '') + '</div>' +
      (info.comp ? '<div class="q-comp">合规：' + esc(info.comp) + '</div>' : '') +
      (q.done ? '' : '<div class="q-actions">' +
        '<button class="btn primary" data-act="focus" data-id="' + q.id + '">专注</button>' +
        '<button class="btn" data-act="settle" data-id="' + q.id + '">结算</button>' +
        (info.family ? '<button class="btn ghost sm" data-act="variant" data-id="' + q.id + '">换路径</button>' : '') +
        (info.family ? '<button class="btn ghost sm" data-act="block" data-id="' + q.id + '">无法执行</button>' : '') +
        '</div>') +
      '</div>';
  }

  /* ---------------- 形态 ---------------- */
  function viewShape() {
    var c = S.character;
    var form = CORE.formCompletion(S);
    var stage = CORE.stageOf(form);
    var m = c.metrics || {};
    var bmi = (m.height && m.weight) ? (m.weight / Math.pow(m.height / 100, 2)).toFixed(1) : '—';

    var groups = CORE.DOMAINS.map(function (d) {
      var attrs = d.attrs.map(function (id) {
        var v = c.attrs[id] || 5, t = c.target[id] || 80;
        return '<div class="attr ' + d.id + '"><span class="name">' + attrName(id) + '</span>' +
          '<div class="track"><i style="width:' + Math.min(100, v / 99 * 100) + '%"></i>' +
          '<u style="left:' + Math.min(99, t / 99 * 100) + '%"></u></div><b>' + v + '</b></div>';
      }).join('');
      return '<div class="attr-group"><div class="attr-g-h">' + d.name + ' · ' + d.attrs.map(function (a) { return CORE.ATTR_MAP[a].en; }).join(' / ') + '</div>' + attrs + '</div>';
    }).join('');

    var ms = CONTENT.milestones.map(function (x) {
      var on = !!(c.milestones || {})[x.id];
      return '<label class="checkline"><input type="checkbox" data-act="milestone" data-id="' + x.id + '" ' + (on ? 'checked' : '') + '>' +
        '<span style="flex:1"><b style="color:' + (on ? 'var(--green)' : 'var(--text)') + '">' + esc(x.name) + '</b><span class="sub"> ' + esc(x.desc) + '</span></span></label>';
    }).join('');

    var skillsByDomain = CORE.DOMAINS.map(function (d) {
      var nodes = CONTENT.skills.filter(function (n) { return n.domain === d.id; });
      return '<div class="attr-group"><div class="attr-g-h">' + d.name + ' 支线 · ' + nodes.filter(function (n) { return c.skills.indexOf(n.id) >= 0; }).length + '/' + nodes.length + '</div>' +
        nodes.map(function (n) {
          var on = c.skills.indexOf(n.id) >= 0;
          return '<div class="row" data-act="skill" data-id="' + n.id + '" style="cursor:pointer"><div class="grow"><div style="color:' + (on ? d.color : 'var(--dim)') + '">' + (on ? '◆ ' : '◇ ') + esc(n.name) + '</div>' +
            '<div class="sub">T' + n.tier + ' · ' + esc(n.desc) + '</div></div>' +
            '<span class="val">' + (on ? '已解锁' : '需 ' + attrName(n.req.attr) + ' ' + n.req.value) + '</span></div>';
        }).join('') + '</div>';
    }).join('');

    return '<div class="card hero"><div class="hero-top"><div><div class="card-t">终极形态</div>' +
      '<div class="hero-name" style="font-size:21px">' + esc(c.targetName || '高阶 INTJ · 优雅高管') + '</div>' +
      '<div class="hero-rank">' + esc(stage.name) + ' · 完成度 ' + form + '%</div></div>' +
      '<div class="hero-lv"><b>' + form + '</b><span>%</span></div></div>' +
      '<div class="xpbar"><i style="width:' + form + '%"></i></div>' +
      '<div class="tag-line mt12">' + (CONTENT.targetPresets[0].signature || []).map(function (x) { return '<span class="badge">' + esc(x) + '</span>'; }).join('') + '</div>' +
      '<button class="btn block mt12" data-act="target">更换终极形态</button></div>' +

      '<div class="sec"><h2>属性</h2><span>目标竖线 = 终极形态</span></div><div class="card">' + groups + '</div>' +

      '<div class="sec"><h2>形象仪表盘</h2><span>只记录可测数字</span></div>' +
      '<div class="card"><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
      fieldNum('mt_height', '身高(cm)', m.height, 140, 230, 0.5) +
      fieldNum('mt_weight', '体重(kg)', m.weight, 35, 160, 0.1) +
      fieldNum('mt_fat', '体脂(%)', m.bodyfat, 3, 45, 0.1) +
      fieldNum('mt_waist', '腰围(cm)', m.waist, 50, 150, 0.5) +
      fieldNum('mt_sleep', '日均睡眠(h)', m.sleep, 0, 14, 0.1) +
      '<div class="field" style="margin:0"><label>BMI</label><div class="input" style="display:flex;align-items:center;color:var(--muted)">' + bmi + '</div></div>' +
      '</div><button class="btn sm block mt8" data-act="metrics-save">保存仪表盘</button>' +
      '<div class="small mt8">体脂、睡眠、腰围是机体域最诚实的证据。</div></div>' +

      '<div class="sec"><h2>里程碑</h2><span>' + CORE.milestonePct(S) + '%</span></div><div class="card">' + ms + '</div>' +

      '<div class="sec"><h2>INTJ 支线</h2><span>功能映射</span></div>' +
      '<div class="card prose"><p><b>Ni 内倾直觉</b> → 二阶思考 / 季度预言</p><p><b>Te 外倾思维</b> → 决策矩阵 / 区域策略</p>' +
      '<p><b>Fi 内倾情感</b> → 价值清单 / 信条</p><p><b>Se 外倾感觉</b> → 力量训练 / 体态 / 声音</p>' +
      '<p class="small">INTJ 的弱点不是不理性，而是把情绪当成事实。用第三视角命名它，再决定是否执行。</p></div>' +

      '<div class="sec"><h2>技能树</h2><span>' + c.skills.length + '/' + CONTENT.skills.length + '</span></div>' + skillsByDomain;
  }

  /* ---------------- 战报 ---------------- */
  function viewLog() {
    var st = CORE.weekStats(S);
    var max = 1;
    Object.keys(st.byDay).forEach(function (k) { max = Math.max(max, st.byDay[k].xp); });
    var days = Object.keys(st.byDay);
    var chart = days.map(function (k) {
      var d = CORE.parseDayKey(k);
      var wd = '日一二三四五六'[d.getDay()];
      return '<div class="b"><i style="height:' + Math.max(3, st.byDay[k].xp / max * 100) + '%"></i><span>' + wd + '</span></div>';
    }).join('');

    var weak = '—';
    var low = CORE.ATTRS.slice().sort(function (a, b) { return (S.character.attrs[a.id] || 5) - (S.character.attrs[b.id] || 5); })[0];
    if (low) weak = low.name;

    var report = '本周 ' + S.character.codename + ' 完成 ' + st.tasks + ' 条任务，获得 ' + st.xp + ' XP；残渣转化率 ' + st.conversion + '%；连击 ' + S.streak.current + ' 天。薄弱项：' + weak + '。';
    var logs = S.logs.slice(-40).reverse().map(function (l) {
      return '<div class="tl-item ' + (Date.now() - l.ts < 86400000 ? 'hot' : '') + '"><div class="d">' + fmtTime(l.ts) + ' · ' + kindName(l.kind) + '</div>' +
        '<div class="t">' + esc(l.title) + (l.report ? ' — ' + esc(l.report) : '') + '</div>' +
        '<div class="m">+' + (l.xp || 0) + ' XP' + (l.deltas ? ' · ' + Object.keys(l.deltas).filter(function (k) { return l.deltas[k]; }).map(function (k) { return attrName(k) + ' ' + (l.deltas[k] > 0 ? '+' : '') + l.deltas[k]; }).join(' / ') : '') + '</div></div>';
    }).join('') || '<div class="empty">还没有战报。完成第一条任务后自动生成。</div>';

    return '<div class="card"><div class="card-h"><div class="card-t strong">本周战报</div><span class="badge">' + CORE.weekKeyOf(todayKey()) + '</span></div>' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center">' +
      '<div><div style="font-size:22px;font-weight:800;color:var(--amber)">' + st.xp + '</div><div class="small">XP</div></div>' +
      '<div><div style="font-size:22px;font-weight:800;color:var(--cyan)">' + st.tasks + '</div><div class="small">任务</div></div>' +
      '<div><div style="font-size:22px;font-weight:800;color:var(--violet)">' + st.conversion + '%</div><div class="small">转化率</div></div></div>' +
      '<div class="chart mt12">' + chart + '</div></div>' +

      '<div class="card"><div class="card-h"><div class="card-t">自动战报</div><span class="card-link" data-act="copy-report">复制</span></div>' +
      '<div class="prose"><p>' + esc(report) + '</p></div></div>' +

      '<div class="sec"><h2>时间线</h2><span>最近 40 条</span></div>' +
      '<div class="card"><div class="tl">' + logs + '</div></div>' +

      '<div class="sec"><h2>本周协议</h2><span>' + (S.protocols.length) + ' 条</span></div>' +
      '<div class="card">' + (S.protocols.length ? S.protocols.slice(-10).reverse().map(function (p) {
        return '<div class="row"><div class="grow">' + esc(p.text) + '</div><span class="val">' + fmtTime(p.createdAt) + '</span></div>';
      }).join('') : '<div class="empty">结算时写下「若…则…」，这里会累积成你的执行协议。</div>') + '</div>';
  }

  /* ---------------- 档案 ---------------- */
  function viewArchive() {
    var owned = S.loot.owned || {};
    var ownedCount = Object.keys(owned).length;
    var grid = CONTENT.loot.map(function (x) {
      var on = !!owned[x.id];
      var eq = (S.loot.equipped || []).indexOf(x.id) >= 0;
      return '<div class="lg ' + x.rarity + (on ? ' owned' : '') + '" data-act="loot" data-id="' + x.id + '">' +
        (eq ? '<span class="eq">●</span>' : '') + '<b>' + esc(on ? x.name : '？？？') + '</b><span>' + (on ? '已收录' : '未获得') + '</span></div>';
    }).join('');

    var cal = S.calibration;
    var calOpt = function (key) {
      var def = CONTENT.calibration[key];
      var opt = def.options.filter(function (o) { return String(o.v) === String(cal[key]); })[0];
      return opt ? opt.label : String(cal[key]);
    };

    return '<div class="card"><div class="card-h"><div class="card-t strong">掉落图鉴</div><span class="badge">' + ownedCount + '/' + CONTENT.loot.length + '</span></div>' +
      '<div class="loot-grid">' + grid + '</div>' +
      '<div class="small mt8">碎片 ✦ ' + S.loot.shards + ' · 已装备 ' + (S.loot.equipped || []).length + '/3（每件提供 XP 加成）</div></div>' +

      '<div class="card"><div class="card-h"><div class="card-t">信条</div><span class="badge">' + S.character.credo.length + '</span></div>' +
      '<div class="prose">' + CONTENT.creeds.map(function (c) {
        var on = S.character.credo.indexOf(c.id) >= 0;
        return '<p style="color:' + (on ? 'var(--text)' : 'var(--dim)') + '">' + (on ? '◈ ' : '◇ ') + esc(c.text) + '</p>';
      }).join('') + '</div></div>' +

      '<div class="card"><div class="card-h"><div class="card-t">现实校准</div><span class="card-link" data-act="cal">修改 ›</span></div>' +
      '<div class="kv"><span>产品线</span><b>' + esc(calOpt('line')) + '</b></div>' +
      '<div class="kv"><span>终端</span><b>' + esc(calOpt('terminal')) + '</b></div>' +
      '<div class="kv"><span>阶段</span><b>' + esc(calOpt('stage')) + '</b></div>' +
      '<div class="kv"><span>医院管控</span><b>' + esc(calOpt('access')) + '</b></div>' +
      '<div class="kv"><span>城市</span><b>' + esc(calOpt('city')) + '</b></div>' +
      '<div class="kv"><span>团队</span><b>' + esc(calOpt('team')) + '</b></div>' +
      '<div class="kv"><span>预算</span><b>' + esc(calOpt('budget')) + '</b></div>' +
      '<div class="kv"><span>每周投入</span><b>' + cal.hours + ' h</b></div></div>' +

      '<div class="card"><div class="card-h"><div class="card-t">维护协议</div><span class="badge">过载时使用</span></div>' +
      '<div class="prose">' + CONTENT.maintenance.map(function (m) { return '<p>' + esc(m.text) + '</p>'; }).join('') + '</div></div>' +

      '<div class="card"><div class="card-h"><div class="card-t">数据</div><span class="badge">本地存储</span></div>' +
      '<div class="btn-row"><button class="btn" data-act="export">导出存档</button><button class="btn" data-act="import">导入存档</button></div>' +
      '<div class="small mt8">数据只保存在这台设备的浏览器里。换机或清理浏览器前务必导出。</div></div>' +

      '<div class="card"><div class="card-h"><div class="card-t">关于</div><span class="badge">v1.0</span></div>' +
      '<div class="prose"><p>载体协议是一个纯本地、零网络的自我训练工具。它不评判你，只记录证据。</p>' +
      '<p>规则：情绪是数据；肉身是载体；行动先于感受。</p>' +
      '<p class="small">本工具不提供医疗、法律或投资建议；涉及药物与客户信息时，遵守公司合规与医院规定。</p></div></div>';
  }

  /* ---------------- 动作分发 ---------------- */
  function bindActions(root) {
    $$('[data-act]', root).forEach(function (el) {
      if (el.__bound) return;
      el.__bound = true;
      el.addEventListener('click', function (ev) {
        if (el.tagName === 'INPUT') return;
        ev.preventDefault();
        handleAct(el.getAttribute('data-act'), el.getAttribute('data-id'), el);
      });
    });
    $$('input[type=checkbox][data-act=milestone]', root).forEach(function (el) {
      if (el.__cb) return; el.__cb = true;
      el.addEventListener('change', function () { handleAct('milestone', el.getAttribute('data-id'), el); });
    });
  }

  function handleAct(act, id, el) {
    if (act === 'tab') { UI.tab = id; render(); return; }
    if (act === 'settings') { openSettings(); return; }
    if (act === 'settle') { openSettle(id); return; }
    if (act === 'focus') { openFocus(id); return; }
    if (act === 'variant') { cycleVariant(id); return; }
    if (act === 'block') { openBlock(id); return; }
    if (act === 'event') { openEvent(id); return; }
    if (act === 'boss') { openBoss(); return; }
    if (act === 'reroll') { reroll(); return; }
    if (act === 'report-save') { saveReport(); return; }
    if (act === 'target') { openTarget(); return; }
    if (act === 'metrics-save') { saveMetrics(); return; }
    if (act === 'milestone') { toggleMilestone(id); return; }
    if (act === 'skill') { openSkill(id); return; }
    if (act === 'loot') { openLoot(id); return; }
    if (act === 'cal') { openCalibration(); return; }
    if (act === 'export') { exportData(); return; }
    if (act === 'import') { openImport(); return; }
    if (act === 'copy-report') { copyReport(); return; }
    if (act === 'intel-add') { openIntel(); return; }
  }

  /* ---------------- Sheet ---------------- */
  function openSheet(title, body, opts) {
    opts = opts || {};
    var ov = $('#overlay');
    ov.innerHTML = '<div class="sheet" role="dialog" aria-modal="true">' +
      '<div class="sheet-h"><div class="sheet-t">' + esc(title) + '</div><button class="sheet-x" data-x="1">✕</button></div>' +
      '<div class="sheet-body">' + body + '</div></div>';
    ov.classList.remove('is-hidden');
    var close = function () {
      ov.classList.add('is-hidden'); ov.innerHTML = '';
      UI.sheetClose = null;
      if (opts.onClose) opts.onClose();
    };
    UI.sheetClose = close;
    $('.sheet-x', ov).onclick = close;
    ov.onclick = function (e) { if (e.target === ov && !opts.locked) close(); };
    var sheet = $('.sheet', ov);
    sheet.scrollTop = 0;
    return { close: close, sheet: sheet };
  }

  /* ---------------- 结算向导 ---------------- */
  function findQuest(id) {
    for (var i = 0; i < S.day.quests.length; i++) if (S.day.quests[i].id === id) return S.day.quests[i];
    return null;
  }

  function openSettle(id) {
    var q = findQuest(id);
    if (!q || q.done) return;
    if (q.kind === 'micro') { openMicro(q); return; }
    if (q.kind === 'event') { openEvent(q.id); return; }
    UI.wiz = {
      qid: id, step: 1, obs: '', hypo: '',
      residue: { on: true, name: '', intensity: 5, halfLifeH: 24, urge: '', verdict: 'delay', reason: '' },
      evidence: '', feasibility: 0, protocol: '', report: '', reportEdited: false, tweak: 0
    };
    renderWizard();
  }

  function wizInfo() {
    var q = findQuest(UI.wiz.qid);
    return { q: q, info: q ? questInfo(q) : null };
  }

  function renderWizard() {
    var w = UI.wiz;
    var x = wizInfo();
    if (!x.q) { closeSheet(); return; }
    var q = x.q, info = x.info;
    var stepNames = ['观测', '解释', '残渣', '结算', '战报'];
    var body = '<div class="wiz-steps">' + stepNames.map(function (_, i) { return '<i class="' + (w.step > i + 1 ? 'done' : w.step === i + 1 ? 'on' : '') + '"></i>'; }).join('') + '</div>' +
      '<div class="wiz-k">STEP ' + w.step + ' / 5 · ' + stepNames[w.step - 1] + '</div>' +
      '<div class="wiz-t">' + esc(info.title) + '</div>' +
      '<div class="wiz-d">' + (['用第三人称记录发生了什么。不写感受，只写可观测事实。', '为这件事写一个可证伪的解释。以「假设：」开头。', '给残留的情绪取样：命名、强度、半衰期。它不是你的，它只是数据。', '写下证据与「若…则…」协议。没有证据的任务不算主线。', '战报由系统生成，可修改；保留代号，删除第一人称。'][w.step - 1]) + '</div>';

    if (w.step === 1) {
      body += '<div class="field"><label>观测（≤80 字，第三人称）</label>' +
        '<textarea class="input" id="w_obs" maxlength="80" placeholder="例：客户在会议中打断该载体两次，该载体停顿后继续。">' + esc(w.obs) + '</textarea>' +
        '<div class="counter"><span id="w_obs_c">' + w.obs.length + '</span>/80</div><div class="lint" id="w_obs_lint"></div>' +
        '<div class="examples"><button data-ex="客户临时取消预约，该载体在原地等待了 20 分钟。">客户取消</button>' +
        '<button data-ex="上级在周会上否定该载体的方案，该载体记录了三点异议。">被否定</button>' +
        '<button data-ex="该载体在深夜想打开短视频，手指停在图标上 10 秒。">冲动</button></div></div>';
    } else if (w.step === 2) {
      body += '<div class="field"><label>解释（必须以「假设：」开头）</label>' +
        '<textarea class="input" id="w_hypo" placeholder="假设：客户打断可能是因为时间压力，而不是针对该载体。">' + esc(w.hypo) + '</textarea>' +
        '<div class="lint" id="w_hypo_lint"></div>' +
        '<div class="examples"><button data-ex="假设：对方在赶时间，这是一种可能的解释。">可能是时间压力</button>' +
        '<button data-ex="假设：该载体的方案缺少一个关键证据，对方只是指出了这一点。">可能缺证据</button></div>' +
        '<div class="small mt8">解释不是安慰，是一个可以被下一件事检验的假设。</div></div>';
    } else if (w.step === 3) {
      var r = w.residue;
      body += '<div class="sw"><div class="sw-l"><div>本次有残渣</div><div class="sub">没有则跳过，直接结算</div></div>' +
        '<div class="switch ' + (r.on ? 'on' : '') + '" id="w_res_on"></div></div>';
      if (r.on) {
        body += '<div class="field mt12"><label>命名（选一个）</label><div class="chips" id="w_emo">' +
          CONTENT.emotions.map(function (e) { return '<button class="chip sm ' + (r.name === e ? 'on' : '') + '" data-emo="' + esc(e) + '">' + esc(e) + '</button>'; }).join('') + '</div></div>' +
          '<div class="field"><label>强度 <b id="w_int_v">' + r.intensity + '</b> / 10</label><input type="range" id="w_int" min="1" max="10" value="' + r.intensity + '"></div>' +
          '<div class="field"><label>半衰期（小时）</label><input class="input" id="w_hl" type="number" min="1" max="240" value="' + r.halfLifeH + '"></div>' +
          '<div class="field"><label>它推动的冲动</label><div class="chips" id="w_urge">' +
          CONTENT.urges.map(function (u) { return '<button class="chip sm ' + (r.urge === u ? 'on' : '') + '" data-urge="' + esc(u) + '">' + esc(u) + '</button>'; }).join('') + '</div></div>' +
          '<div class="field"><label>裁决</label><div class="seg" id="w_verdict">' +
          CORE.URGE_VERDICTS.map(function (v) { return '<button class="' + (r.verdict === v.id ? 'on' : '') + '" data-verdict="' + v.id + '">' + v.name + '</button>'; }).join('') + '</div>' +
          '<div class="lint" id="w_res_lint"></div></div>';
      }
    } else if (w.step === 4) {
      body += '<div class="field"><label>证据（可验证）</label><input class="input" id="w_ev" value="' + esc(w.evidence) + '" placeholder="' + esc(info.evidence) + '">' +
        '<div class="lint" id="w_ev_lint"></div></div>' +
        '<div class="field"><label>这件事的可执行性（1-5）</label><div class="seg" id="w_feas">' +
        [1, 2, 3, 4, 5].map(function (n) { return '<button class="' + (w.feasibility === n ? 'on' : '') + '" data-feas="' + n + '">' + n + '</button>'; }).join('') + '</div>' +
        '<div class="small mt8">低于 3 分会被记录为「不适合该载体」，系统会减少这类任务。</div></div>' +
        '<div class="field"><label>若…则…协议（可选）</label><input class="input" id="w_pro" value="' + esc(w.protocol) + '" placeholder="若下周同一客户再次打断，则该载体先停 6 秒再回应。">' +
        '<div class="lint" id="w_pro_lint"></div></div>' +
        '<div class="field"><label>主属性微调（±0.5，可选）</label><div class="seg" id="w_tweak">' +
        [['-0.5', -0.5], ['0', 0], ['+0.5', 0.5]].map(function (t) { return '<button class="' + (w.tweak === t[1] ? 'on' : '') + '" data-tweak="' + t[1] + '">' + t[0] + '</button>'; }).join('') + '</div></div>' +
        '<div class="small">预计 +' + CORE.taskXp(S, q, Date.now()) + ' XP · ' + esc(attrName(info.family.attr)) + ' 为主属性</div>';
    } else {
      var input = { obs: w.obs, action: '按协议完成了核心动作', evidence: w.evidence, verdict: w.residue.verdict };
      if (!w.reportEdited || !w.report) w.report = CORE.buildReport(S, q, input);
      body += '<div class="field"><label>战报（自动生成，可改）</label>' +
        '<textarea class="input" id="w_report" maxlength="220">' + esc(w.report) + '</textarea>' +
        '<div class="lint" id="w_report_lint"></div>' +
        '<div class="small mt8">战报必须包含代号，且不能出现「我」。这是给未来的你看的证据。</div></div>' +
        '<div class="small">结算后：+' + CORE.taskXp(S, q, Date.now()) + ' XP，属性增长按当前值递减。</div>';
    }

    body += '<div class="wiz-nav">' + (w.step > 1 ? '<button class="btn" data-w="prev">上一步</button>' : '') +
      '<button class="btn primary" data-w="' + (w.step === 5 ? 'submit' : 'next') + '">' + (w.step === 5 ? '完成结算' : '下一步') + '</button></div>';
    body += '<div class="small center mt8" style="color:var(--dim)">今日协议由校准与近期反馈生成 · 内容可换路径</div>';

    var sh = openSheet('结算 · ' + info.title, body, { locked: true });
    bindWizard(sh.sheet);
  }

  function bindWizard(sheet) {
    var w = UI.wiz;
    var obs = $('#w_obs', sheet), hypo = $('#w_hypo', sheet);
    if (obs) {
      var lint = function () {
        w.obs = obs.value;
        var r = CORE.lintObs(w.obs);
        $('#w_obs_c', sheet).textContent = w.obs.length;
        var l = $('#w_obs_lint', sheet);
        if (!w.obs.trim()) { l.className = 'lint'; l.textContent = '至少写一句可观测事实。'; }
        else if (!r.ok) { l.className = 'lint bad'; l.textContent = '出现第一人称/情绪直述：' + r.hits.map(function (h) { return h.text; }).join('、') + '。改成「该载体…」'; }
        else { l.className = 'lint ok'; l.textContent = '通过：这是观测，不是情绪。'; }
      };
      obs.addEventListener('input', lint);
      lint();
      $$('[data-ex]', sheet).forEach(function (b) { b.onclick = function () { obs.value = b.getAttribute('data-ex'); w.obs = obs.value; lint(); }; });
    }
    if (hypo) {
      var lintH = function () {
        w.hypo = hypo.value;
        var r = CORE.lintHypo(w.hypo);
        var l = $('#w_hypo_lint', sheet);
        if (!w.hypo.trim()) { l.className = 'lint'; l.textContent = '以「假设：」开头，并包含「可能/或许」等不确定词。'; }
        else if (!r.ok) { l.className = 'lint bad'; l.textContent = '格式不对：必须「假设：…可能…」。'; }
        else { l.className = 'lint ok'; l.textContent = '通过：这是一个可检验的解释。'; }
      };
      hypo.addEventListener('input', lintH); lintH();
      $$('[data-ex]', sheet).forEach(function (b) { b.onclick = function () { hypo.value = b.getAttribute('data-ex'); w.hypo = hypo.value; lintH(); }; });
    }
    var resOn = $('#w_res_on', sheet);
    if (resOn) resOn.onclick = function () { w.residue.on = !w.residue.on; renderWizard(); };
    $$('[data-emo]', sheet).forEach(function (b) {
      b.onclick = function () {
        w.residue.name = b.getAttribute('data-emo');
        w.residue.halfLifeH = CONTENT.emotionHalfLife[w.residue.name] || 24;
        renderWizard();
      };
    });
    var intR = $('#w_int', sheet);
    if (intR) intR.oninput = function () { w.residue.intensity = Number(intR.value); $('#w_int_v', sheet).textContent = intR.value; };
    var hl = $('#w_hl', sheet);
    if (hl) hl.oninput = function () { w.residue.halfLifeH = Number(hl.value) || 24; };
    $$('[data-urge]', sheet).forEach(function (b) {
      b.onclick = function () { w.residue.urge = w.residue.urge === b.getAttribute('data-urge') ? '' : b.getAttribute('data-urge'); renderWizard(); };
    });
    $$('[data-verdict]', sheet).forEach(function (b) {
      b.onclick = function () { w.residue.verdict = b.getAttribute('data-verdict'); renderWizard(); };
    });
    var ev = $('#w_ev', sheet);
    if (ev) ev.oninput = function () { w.evidence = ev.value; };
    $$('[data-feas]', sheet).forEach(function (b) {
      b.onclick = function () { w.feasibility = Number(b.getAttribute('data-feas')); renderWizard(); };
    });
    var pro = $('#w_pro', sheet);
    if (pro) pro.oninput = function () { w.protocol = pro.value; };
    $$('[data-tweak]', sheet).forEach(function (b) {
      b.onclick = function () { w.tweak = Number(b.getAttribute('data-tweak')); renderWizard(); };
    });
    var rep = $('#w_report', sheet);
    if (rep) {
      rep.oninput = function () {
        w.report = rep.value; w.reportEdited = true;
        var r = CORE.lintReport(w.report, S.character.codename);
        var l = $('#w_report_lint', sheet);
        l.className = r.ok ? 'lint ok' : 'lint bad';
        l.textContent = r.ok ? '通过。' : r.hits.map(function (h) { return h.text; }).join('、');
      };
      var r0 = CORE.lintReport(w.report, S.character.codename);
      var l0 = $('#w_report_lint', sheet);
      l0.className = r0.ok ? 'lint ok' : 'lint bad';
      l0.textContent = r0.ok ? '通过。' : r0.hits.map(function (h) { return h.text; }).join('、');
    }

    $$('[data-w]', sheet).forEach(function (b) {
      b.onclick = function () {
        var a = b.getAttribute('data-w');
        if (a === 'prev') { w.step = Math.max(1, w.step - 1); renderWizard(); return; }
        if (a === 'next') { if (!validateStep(w)) return; w.step++; renderWizard(); return; }
        if (a === 'submit') { submitWizard(); }
      };
    });
  }

  function validateStep(w) {
    var x = wizInfo();
    if (w.step === 1) {
      if (!w.obs.trim()) { toast('观测不能为空', 'bad'); return false; }
      var r = CORE.lintObs(w.obs);
      if (!r.ok) { toast('还有第一人称/情绪直述：' + r.hits.map(function (h) { return h.text; }).join('、'), 'bad'); return false; }
    }
    if (w.step === 2) {
      if (!CORE.lintHypo(w.hypo).ok) { toast('解释必须是「假设：…可能…」', 'bad'); return false; }
    }
    if (w.step === 3 && w.residue.on) {
      if (!w.residue.name) { toast('请命名残渣，或关闭「本次有残渣」', 'bad'); return false; }
    }
    if (w.step === 4) {
      if (!w.evidence.trim()) { toast('证据不能为空', 'bad'); return false; }
      if (!w.feasibility) { toast('请给可执行性打分', 'bad'); return false; }
      if (w.protocol && !/若[\s\S]+则/.test(w.protocol)) { toast('协议请写成「若…则…」', 'bad'); return false; }
    }
    if (w.step === 5) {
      if (!CORE.lintReport(w.report, S.character.codename).ok) { toast('战报必须含代号且不能出现「我」', 'bad'); return false; }
    }
    return true;
  }

  function submitWizard() {
    var w = UI.wiz;
    var x = wizInfo();
    if (!x.q || !validateStep(w)) return;
    var q = x.q;
    var now = Date.now();
    var res = CORE.completeQuest(S, q, {
      obs: w.obs, hypo: w.hypo, action: '按协议完成了核心动作',
      evidence: w.evidence, report: w.report, protocol: w.protocol, feasibility: w.feasibility
    }, now);
    if (w.tweak && x.info.family) {
      var aid = x.info.family.attr;
      S.character.attrs[aid] = clamp(round1((S.character.attrs[aid] || 5) + w.tweak), 1, 99);
      res.deltas[aid] = round1((res.deltas[aid] || 0) + w.tweak);
    }
    if (w.residue.on && w.residue.name) {
      CORE.addResidue(S, {
        name: w.residue.name, intensity: w.residue.intensity, halfLifeH: w.residue.halfLifeH,
        urge: w.residue.urge, verdict: w.residue.verdict, reason: '', source: 'settle'
      }, now);
    }
    CORE.checkSkills(S);
    save();
    closeSheet();
    UI.wiz = null;
    render();
    showResult(res, w.report);
  }

  function showResult(res, report) {
    var body = '<div class="result"><div class="xp">+' + res.xp + ' <small>XP</small></div>' +
      (res.levelUp ? '<div class="small mt8" style="color:var(--amber)">LEVEL UP · LV ' + S.character.level + ' · ' + esc(CORE.rankOf(S.character.level).name) + '</div>' : '') +
      (res.rankUp ? '<div class="small mt8" style="color:var(--violet)">称号晋升：' + esc(CORE.rankOf(S.character.level).name) + '</div>' : '') +
      (res.allClear ? '<div class="small mt8" style="color:var(--green)">全清 · +3 点 · 惰性 -10</div>' : '') +
      '</div><div class="deltas">' + Object.keys(res.deltas || {}).filter(function (k) { return res.deltas[k]; }).map(function (k) {
        return '<span class="delta">' + attrName(k) + ' ' + (res.deltas[k] > 0 ? '+' : '') + res.deltas[k] + '</span>';
      }).join('') + (res.converted ? '<span class="delta" style="border-color:rgba(74,222,128,.3);color:#baf7d0">残渣转化 ×' + res.converted + ' +' + res.convBonus + ' XP</span>' : '') + '</div>';

    if (res.loot) {
      var it = res.loot.item, rar = CORE.LOOT_RARITY[it.rarity];
      body += '<div class="loot-card ' + it.rarity + '"><div class="loot-r">' + rar.name + ' · 掉落</div>' +
        '<div class="loot-n" style="color:' + rar.color + '">' + esc(it.name) + '</div>' +
        '<div class="loot-t">' + esc(it.text) + '</div>' +
        (res.loot.dup ? '<div class="small mt8">重复 → 碎片 +' + res.loot.shards + '</div>' : '<div class="small mt8">已收录。可在档案中装备（最多 3 件）。</div>') + '</div>';
    } else {
      body += '<div class="small center mt12" style="color:var(--dim)">本次没有掉落。概率不是奖励，是节奏。</div>';
    }
    body += '<div class="card mt12" style="background:rgba(8,13,20,.5)"><div class="small" style="color:var(--dim)">战报</div><div class="prose mt8"><p>' + esc(report) + '</p></div></div>';
    body += '<button class="btn primary block mt12" data-x="1">继续</button>';
    var sh = openSheet('结算完成', body);
    $$('[data-x]', sh.sheet).forEach(function (b) { b.onclick = function () { sh.close(); }; });
    vibrate([8, 40, 12]); beep(760, 0.09);
    setTimeout(function () { beep(1040, 0.12); }, 110);
  }

  /* ---------------- 微训练 ---------------- */
  function openMicro(q) {
    var m = CORE.microById(q.microId) || { action: '微训练', attr: 'wil', minutes: 5 };
    var body = '<div class="wiz-d">做完即可，不要求仪式。写下你做了什么。</div>' +
      '<div class="field"><label>动作</label><div class="q-action">' + esc(m.action) + '</div></div>' +
      '<div class="field"><label>备注（可选）</label><input class="input" id="m_note" maxlength="60" placeholder="例：靠墙站 3 分钟，肩胛有感觉。"></div>' +
      '<button class="btn primary block" data-m="ok">完成 · +' + CORE.taskXp(S, q, Date.now()) + ' XP</button>';
    var sh = openSheet('微训练 · ' + attrName(m.attr), body);
    $('[data-m=ok]', sh.sheet).onclick = function () {
      var note = $('#m_note', sh.sheet).value || '';
      var res = CORE.completeQuest(S, q, { obs: note ? '该载体完成：' + note : '该载体完成微训练。', action: m.action, evidence: note }, Date.now());
      CORE.checkSkills(S); save(); sh.close(); render();
      toast('+' + res.xp + ' XP · ' + attrName(m.attr) + ' +' + (res.deltas[m.attr] || 0), 'good');
      vibrate(10);
    };
  }

  /* ---------------- 事件 ---------------- */
  function openEvent(id) {
    var q = findQuest(id);
    if (!q || q.done) return;
    var e = CORE.eventById(q.eventId);
    if (!e) return;
    var body = '<div class="prose"><p>' + esc(e.text) + '</p></div>' +
      e.options.map(function (o, i) {
        return '<button class="btn block mt8" style="text-align:left;justify-content:flex-start;padding:12px" data-opt="' + i + '">' + esc(o.label) + '</button>';
      }).join('');
    var sh = openSheet('事件 · ' + e.title, body);
    $$('[data-opt]', sh.sheet).forEach(function (b) {
      b.onclick = function () {
        var i = Number(b.getAttribute('data-opt'));
        var res = CORE.applyEvent(S, e, i, Date.now());
        CORE.checkSkills(S); save(); sh.close(); render();
        var rbody = '<div class="result"><div class="xp">+' + res.xp + ' <small>XP</small></div></div>' +
          '<div class="deltas">' + Object.keys(res.deltas || {}).map(function (k) {
            return '<span class="delta">' + attrName(k) + ' ' + (res.deltas[k] > 0 ? '+' : '') + res.deltas[k] + '</span>';
          }).join('') + '</div>' +
          '<div class="card" style="background:rgba(8,13,20,.5)"><div class="prose"><p>' + esc(res.outcome) + '</p></div></div>' +
          '<button class="btn primary block mt12" data-x="1">关闭</button>';
        var sh2 = openSheet('结果', rbody);
        $('[data-x]', sh2.sheet).onclick = function () { sh2.close(); };
      };
    });
  }

  /* ---------------- Boss ---------------- */
  function currentBoss() {
    if (!S.boss) return null;
    return CORE.bossById(S.boss.id);
  }
  function openBoss() {
    var b = currentBoss();
    if (!b || S.boss.status === 'done') return;
    var body = '<div class="prose"><p>' + esc(b.desc) + '</p></div>' +
      '<div class="field mt12"><label>证据（可验证）</label><textarea class="input" id="b_ev" placeholder="' + esc(b.evidence) + '"></textarea></div>' +
      '<div class="small">奖励：+' + b.xp + ' XP · 点数 +10 · 一次掉落</div>' +
      '<button class="btn amber block mt12" data-b="ok">提交并结算</button>';
    var sh = openSheet('BOSS · ' + b.name, body);
    $('[data-b=ok]', sh.sheet).onclick = function () {
      var ev = $('#b_ev', sh.sheet).value.trim();
      if (!ev) { toast('证据不能为空', 'bad'); return; }
      var res = CORE.completeBoss(S, ev, Date.now());
      CORE.checkSkills(S); save(); sh.close(); render();
      if (res) {
        var rb = '<div class="result"><div class="xp">+' + res.xp + ' <small>XP</small></div></div>' +
          (res.loot ? '<div class="loot-card ' + res.loot.item.rarity + '"><div class="loot-r">' + CORE.LOOT_RARITY[res.loot.item.rarity].name + ' · 掉落</div><div class="loot-n">' + esc(res.loot.item.name) + '</div><div class="loot-t">' + esc(res.loot.item.text) + '</div></div>' : '') +
          '<button class="btn primary block mt12" data-x="1">关闭</button>';
        var s2 = openSheet('BOSS 击破', rb);
        $('[data-x]', s2.sheet).onclick = function () { s2.close(); };
      }
    };
  }

  /* ---------------- 换路径 / 无法执行 ---------------- */
  function cycleVariant(id) {
    var q = findQuest(id);
    var f = q && CORE.familyById(q.familyId);
    if (!f || !f.variants.length) return;
    var idx = -1;
    for (var i = 0; i < f.variants.length; i++) if (f.variants[i].id === q.variantId) idx = i;
    var next = f.variants[(idx + 1) % f.variants.length];
    q.variantId = next.id;
    q.minutes = next.minutes || f.minutes;
    save(); render();
    toast('已切换路径：' + next.label, 'good');
  }

  function openBlock(id) {
    var q = findQuest(id);
    var f = q && CORE.familyById(q.familyId);
    if (!f) return;
    var reasons = ['医院/科室禁入或无法预约', '客户没有时间', '没有预算/资源', '产品阶段或准入不符', '内容不适合我的市场', '其他'];
    var body = '<div class="wiz-d">选一个原因。系统会先换路径，连续 3 次无法执行则退役该任务族。</div>' +
      reasons.map(function (r, i) { return '<button class="btn block mt8" style="text-align:left;justify-content:flex-start" data-reason="' + i + '">' + esc(r) + '</button>'; }).join('');
    var sh = openSheet('无法执行 · ' + f.title, body);
    $$('[data-reason]', sh.sheet).forEach(function (b) {
      b.onclick = function () {
        var reason = reasons[Number(b.getAttribute('data-reason'))];
        S.feedback.blockers = S.feedback.blockers || {};
        var rec = S.feedback.blockers[f.id] || { count: 0, reasons: [] };
        rec.count++; rec.reasons.push({ reason: reason, ts: Date.now() });
        S.feedback.blockers[f.id] = rec;

        /* 先尝试换到另一个可执行变体 */
        var alt = null;
        for (var i = 0; i < f.variants.length; i++) {
          var vv = f.variants[i];
          if (vv.id !== q.variantId && CORE.matchWhen(vv.when, S.calibration)) { alt = vv; break; }
        }
        if (alt) {
          q.variantId = alt.id; q.minutes = alt.minutes || f.minutes;
          save(); sh.close(); render();
          toast('已换到可执行路径：' + alt.label, 'good');
          return;
        }
        /* 无路径：达到 3 次则退役并替换任务 */
        if (rec.count >= 3) {
          S.meta.bannedFamilies = S.meta.bannedFamilies || [];
          if (S.meta.bannedFamilies.indexOf(f.id) < 0) S.meta.bannedFamilies.push(f.id);
          var pool = CORE.relevantFamilies(S).filter(function (x) { return x.id !== f.id; });
          var same = pool.filter(function (x) { return x.tier === f.tier && x.domain === f.domain; });
          var cand = (same.length ? same : pool)[0];
          if (cand) {
            var nq = CORE.makeQuest(cand, q.kind, S);
            nq.id = q.id;
            var idx = S.day.quests.indexOf(q);
            S.day.quests[idx] = nq;
          }
          S.feedback.retired = S.feedback.retired || [];
          if (S.feedback.retired.indexOf(f.id) < 0) S.feedback.retired.push(f.id);
          save(); sh.close(); render();
          toast('该任务族已退役，已替换为同域任务', 'amber');
        } else {
          save(); sh.close(); render();
          toast('已记录（' + rec.count + '/3）。系统会减少此类任务。', 'amber');
        }
      };
    });
  }

  /* ---------------- 换牌 / 状态报告 ---------------- */
  function reroll() {
    if (S.character.xp === 0) { toast('先完成一条任务再换牌', 'bad'); return; }
    if (S.day.rerolls >= 1) { toast('今日已换过一次牌', 'bad'); return; }
    S.day.rerolls = (S.day.rerolls || 0) + 1;
    CORE.regenerateDaily(S, todayKey());
    save(); render();
    toast('今日协议已重抽（已完成任务保留）', 'good');
    vibrate(14);
  }

  function saveReport() {
    var r = S.day.report || (S.day.report = {});
    r.sleep = Number($('#rp_sleep').value) || 0;
    r.load = Number($('#rp_load').value) || 3;
    r.energy = Number($('#rp_energy').value) || 3;
    r.pain = Number($('#rp_pain').value) || 0;
    S.day.overload = r.sleep > 0 && r.sleep < 6;
    if (!S.meta.reportXpDay || S.meta.reportXpDay !== S.day.key) {
      var xp = CORE.dailyReportXp(S);
      if (xp > 0) {
        S.character.xp += xp;
        S.character.level = CORE.levelFromXp(S.character.xp);
        S.character.title = CORE.rankOf(S.character.level).name;
        S.meta.reportXpDay = S.day.key;
        toast('状态已保存 · +' + xp + ' XP', 'good');
      }
    } else {
      toast('状态已保存', 'good');
    }
    save(); render();
  }

  /* ---------------- 目标 / 指标 / 里程碑 / 技能 ---------------- */
  function openTarget() {
    var body = '<div class="wiz-d">选择终极形态会覆盖当前 12 项目标值；属性不会被重置。</div>' +
      CONTENT.targetPresets.map(function (p) {
        return '<div class="card" style="background:rgba(8,13,20,.5)"><div style="font-weight:700">' + esc(p.name) + '</div>' +
          '<div class="small mt8">' + esc(p.desc) + '</div>' +
          '<div class="tag-line mt8">' + p.signature.map(function (s) { return '<span class="badge">' + esc(s) + '</span>'; }).join('') + '</div>' +
          '<button class="btn sm primary block mt8" data-preset="' + p.id + '">选择</button></div>';
      }).join('');
    var sh = openSheet('终极形态', body);
    $$('[data-preset]', sh.sheet).forEach(function (b) {
      b.onclick = function () {
        for (var i = 0; i < CONTENT.targetPresets.length; i++) {
          if (CONTENT.targetPresets[i].id === b.getAttribute('data-preset')) {
            var p = CONTENT.targetPresets[i];
            S.character.target = JSON.parse(JSON.stringify(p.target));
            S.character.targetName = p.name;
            save(); sh.close(); render();
            toast('目标已切换：' + p.name, 'good');
          }
        }
      };
    });
  }

  function saveMetrics() {
    var m = S.character.metrics || (S.character.metrics = {});
    m.height = Number($('#mt_height').value) || null;
    m.weight = Number($('#mt_weight').value) || null;
    m.bodyfat = Number($('#mt_fat').value) || null;
    m.waist = Number($('#mt_waist').value) || null;
    m.sleep = Number($('#mt_sleep').value) || null;
    save(); render();
    toast('仪表盘已更新', 'good');
  }

  function toggleMilestone(id) {
    S.character.milestones = S.character.milestones || {};
    S.character.milestones[id] = !S.character.milestones[id];
    save(); render();
    vibrate(10);
  }

  function openSkill(id) {
    var n = null;
    for (var i = 0; i < CONTENT.skills.length; i++) if (CONTENT.skills[i].id === id) n = CONTENT.skills[i];
    if (!n) return;
    var on = S.character.skills.indexOf(n.id) >= 0;
    var body = '<div class="prose"><p><b>' + esc(n.name) + '</b> · T' + n.tier + ' · ' + esc(domainName(n.domain)) + '</p>' +
      '<p>' + esc(n.desc) + '</p></div>' +
      '<div class="kv"><span>解锁条件</span><b>' + esc(attrName(n.req.attr)) + ' ≥ ' + n.req.value + '</b></div>' +
      '<div class="kv"><span>当前</span><b>' + esc(attrName(n.req.attr)) + ' ' + (S.character.attrs[n.req.attr] || 5) + '</b></div>' +
      '<div class="kv"><span>加成</span><b>' + esc(domainName(n.domain)) + ' 域 XP +' + Math.round(n.buff.mult * 100) + '%</b></div>' +
      '<div class="small mt12">' + (on ? '已解锁。' : '继续提升该属性即可自动解锁。') + '</div>';
    openSheet('技能 · ' + n.name, body);
  }

  function openLoot(id) {
    var it = null;
    for (var i = 0; i < CONTENT.loot.length; i++) if (CONTENT.loot[i].id === id) it = CONTENT.loot[i];
    if (!it) return;
    var owned = !!S.loot.owned[id];
    var eq = (S.loot.equipped || []).indexOf(id) >= 0;
    var rar = CORE.LOOT_RARITY[it.rarity];
    var body = '<div class="loot-card ' + it.rarity + '"><div class="loot-r">' + rar.name + '</div><div class="loot-n" style="color:' + rar.color + '">' + esc(owned ? it.name : '未获得') + '</div>' +
      '<div class="loot-t">' + esc(owned ? it.text : '继续完成任务以收录。') + '</div></div>' +
      (owned ? '<button class="btn ' + (eq ? 'danger' : 'primary') + ' block mt12" data-eq="1">' + (eq ? '卸下' : '装备') + '</button>' : '');
    var sh = openSheet('掉落 · ' + (owned ? it.name : '未获得'), body);
    var b = $('[data-eq]', sh.sheet);
    if (b) b.onclick = function () {
      var list = S.loot.equipped || [];
      if (eq) { list = list.filter(function (x) { return x !== id; }); }
      else {
        if (list.length >= 3) { toast('最多装备 3 件', 'bad'); return; }
        list.push(id);
      }
      S.loot.equipped = list; save(); sh.close(); render(); toast(eq ? '已卸下' : '已装备', 'good');
    };
  }

  /* ---------------- 校准 / 设置 ---------------- */
  function openCalibration() {
    var body = '';
    Object.keys(CONTENT.calibration).forEach(function (key) {
      var def = CONTENT.calibration[key];
      if (key === 'hours') return;
      body += '<div class="field"><label>' + esc(def.label) + '</label><div class="chips" data-cal="' + key + '">' +
        def.options.map(function (o) { return '<button class="chip ' + (String(S.calibration[key]) === String(o.v) ? 'on' : '') + '" data-v="' + esc(String(o.v)) + '">' + esc(o.short || o.label) + '</button>'; }).join('') + '</div></div>';
    });
    body += '<div class="field"><label>每周可投入小时：<b id="cal_hv">' + S.calibration.hours + '</b> h</label><input type="range" id="cal_h" min="2" max="30" value="' + S.calibration.hours + '"></div>' +
      '<div class="small">修改校准会重新生成今日未完成的任务，已完成的保留。</div>' +
      '<button class="btn primary block mt12" data-cal-save="1">保存校准</button>';
    var sh = openSheet('现实校准', body);
    var tmp = JSON.parse(JSON.stringify(S.calibration));
    $$('[data-cal]', sh.sheet).forEach(function (grp) {
      var key = grp.getAttribute('data-cal');
      $$('.chip', grp).forEach(function (c) {
        c.onclick = function () {
          $$('.chip', grp).forEach(function (x) { x.classList.remove('on'); });
          c.classList.add('on');
          var v = c.getAttribute('data-v');
          if (v === 'true') tmp[key] = true; else if (v === 'false') tmp[key] = false; else tmp[key] = v;
        };
      });
    });
    $('#cal_h', sh.sheet).oninput = function () { tmp.hours = Number(this.value); $('#cal_hv', sh.sheet).textContent = this.value; };
    $('[data-cal-save]', sh.sheet).onclick = function () {
      S.calibration = tmp;
      CORE.regenerateDaily(S, todayKey());
      save(); sh.close(); render();
      toast('校准已更新，今日任务已重算', 'good');
    };
  }

  function openSettings() {
    var body = '<div class="sec" style="margin-top:0"><h2>难度</h2></div><div class="seg" id="st_diff">' +
      ['hardcore', 'standard', 'soft'].map(function (k) { return '<button class="' + (S.settings.difficulty === k ? 'on' : '') + '" data-diff="' + k + '">' + CORE.DIFFICULTY[k].name + '</button>'; }).join('') + '</div>' +
      '<div class="small mt8">硬核：断链 3 天 XP×0.8，残渣惩罚更重。修改立即生效。</div>' +
      '<div class="sec"><h2>节奏</h2></div>' +
      '<div class="field"><label>每日重置时间</label><div class="chips" id="st_reset">' +
      [0, 2, 3, 4, 5, 6].map(function (h) { return '<button class="chip sm ' + (S.settings.resetHour === h ? 'on' : '') + '" data-reset="' + h + '">' + h + ':00</button>'; }).join('') + '</div></div>' +
      '<div class="sw"><div class="sw-l"><div>震动反馈</div></div><div class="switch ' + (S.settings.haptics ? 'on' : '') + '" data-tgl="haptics"></div></div>' +
      '<div class="sw"><div class="sw-l"><div>音效</div></div><div class="switch ' + (S.settings.sound ? 'on' : '') + '" data-tgl="sound"></div></div>' +
      '<div class="sec"><h2>安装</h2></div>' +
      (UI.installPrompt ? '<button class="btn primary block" data-install="1">安装到主屏幕</button>' :
        '<div class="small">在浏览器菜单里选「添加到主屏幕 / 安装应用」，即可全屏、离线使用。</div>') +
      '<div class="sec"><h2>数据</h2></div>' +
      '<div class="btn-row"><button class="btn" data-act="export">导出</button><button class="btn" data-act="import">导入</button></div>' +
      '<button class="btn danger block mt12" data-reset-all="1">清空全部数据</button>' +
      '<div class="small mt8">清空不可恢复。建议先导出。</div>';
    var sh = openSheet('设置', body);
    $$('[data-diff]', sh.sheet).forEach(function (b) {
      b.onclick = function () { S.settings.difficulty = b.getAttribute('data-diff'); save(); sh.close(); render(); toast('难度已切换', 'good'); };
    });
    $$('[data-reset]', sh.sheet).forEach(function (b) {
      b.onclick = function () { S.settings.resetHour = Number(b.getAttribute('data-reset')); save(); sh.close(); render(); toast('重置时间已更新', 'good'); };
    });
    $$('[data-tgl]', sh.sheet).forEach(function (b) {
      b.onclick = function () {
        var k = b.getAttribute('data-tgl');
        S.settings[k] = !S.settings[k];
        b.className = 'switch ' + (S.settings[k] ? 'on' : '');
        save();
      };
    });
    $('[data-reset-all]', sh.sheet).onclick = function () {
      if (!confirm('确定清空全部数据？此操作不可恢复。')) return;
      if (!confirm('再确认一次：所有属性、战报、掉落都会消失。')) return;
      try { localStorage.removeItem(KEY); } catch (e) {}
      location.reload();
    };
    var inst = $('[data-install]', sh.sheet);
    if (inst) inst.onclick = function () {
      var p = UI.installPrompt;
      if (!p) return;
      UI.installPrompt = null;
      p.prompt();
      if (p.userChoice) p.userChoice.then(function () { sh.close(); });
    };
  }

  /* ---------------- 导入导出 / 情报 ---------------- */
  function exportData() {
    var json = CORE.serialize(S);
    S.meta.lastExportAt = Date.now(); save();
    try {
      var blob = new Blob([json], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'vessel-' + todayKey() + '.json';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    } catch (e) {}
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(json).then(function () { toast('已复制存档到剪贴板', 'good'); }, function () { toast('已导出文件', 'good'); });
    } else {
      toast('已导出文件', 'good');
    }
  }

  function openImport() {
    var body = '<div class="wiz-d">粘贴导出的 JSON，或选择文件。导入会覆盖当前进度。</div>' +
      '<div class="field"><input type="file" id="imp_file" accept="application/json,.json" class="input" style="padding:8px"></div>' +
      '<div class="field"><textarea class="input" id="imp_text" placeholder="粘贴存档 JSON…" style="min-height:120px"></textarea></div>' +
      '<div class="btn-row"><button class="btn" data-imp="text">从文本导入</button><button class="btn primary" data-imp="file">从文件导入</button></div>';
    var sh = openSheet('导入存档', body);
    var fileData = null;
    $('#imp_file', sh.sheet).onchange = function (e) {
      var f = e.target.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () { fileData = reader.result; toast('文件已读取', 'good'); };
      reader.readAsText(f);
    };
    function doImport(text) {
      try {
        var next = CORE.deserialize(text);
        if (!next || !next.character) throw new Error('bad');
        if (!confirm('导入将覆盖当前进度，确定？')) return;
        S = next;
        localStorage.setItem(KEY, CORE.serialize(S));
        sh.close();
        S.meta.onboarded = true;
        startApp();
        toast('存档已导入', 'good');
      } catch (e) { toast('存档格式不正确', 'bad'); }
    }
    $('[data-imp=text]', sh.sheet).onclick = function () { doImport($('#imp_text', sh.sheet).value); };
    $('[data-imp=file]', sh.sheet).onclick = function () { if (!fileData) { toast('请先选择文件', 'bad'); return; } doImport(fileData); };
  }

  function openIntel() {
    var body = '<div class="field"><label>情报标题</label><input class="input" id="in_t" maxlength="40" placeholder="例：某院药事会 12 月召开"></div>' +
      '<div class="field"><label>来源（可验证）</label><input class="input" id="in_s" maxlength="60" placeholder="例：医院公众号 / 客户口述 / 学会通知"></div>' +
      '<div class="field"><label>备注</label><textarea class="input" id="in_n" maxlength="120" placeholder="它改变了什么？"></textarea></div>' +
      '<button class="btn primary block" data-in="ok">保存情报</button>' +
      (S.intel.length ? '<div class="sec"><h2>已有情报</h2></div>' + S.intel.slice().reverse().map(function (it) {
        return '<div class="row"><div class="grow"><div>' + esc(it.title) + '</div><div class="sub">' + esc(it.source || '') + ' · ' + fmtTime(it.ts) + '</div></div>' +
          '<button class="btn sm danger" data-del="' + it.id + '">删</button></div>';
      }).join('') : '');
    var sh = openSheet('情报卡', body);
    $$('[data-del]', sh.sheet).forEach(function (b) {
      b.onclick = function () {
        S.intel = S.intel.filter(function (x) { return x.id !== b.getAttribute('data-del'); });
        save(); sh.close(); render(); toast('已删除', 'good');
      };
    });
    $('[data-in=ok]', sh.sheet).onclick = function () {
      var t = $('#in_t', sh.sheet).value.trim();
      if (!t) { toast('标题不能为空', 'bad'); return; }
      S.intel.push({ id: 'i' + Date.now(), title: t, source: $('#in_s', sh.sheet).value.trim(), note: $('#in_n', sh.sheet).value.trim(), ts: Date.now() });
      save(); sh.close(); render(); toast('情报已收录', 'good');
    };
  }

  function copyReport() {
    var st = CORE.weekStats(S);
    var low = CORE.ATTRS.slice().sort(function (a, b) { return (S.character.attrs[a.id] || 5) - (S.character.attrs[b.id] || 5); })[0];
    var text = '本周 ' + S.character.codename + ' 完成 ' + st.tasks + ' 条任务，获得 ' + st.xp + ' XP；残渣转化率 ' + st.conversion + '%；连击 ' + S.streak.current + ' 天。薄弱项：' + (low ? low.name : '—') + '。';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast('战报已复制', 'good'); }, function () { toast(text, 'good'); });
    } else { toast(text, 'good'); }
  }

  /* ---------------- 专注计时 ---------------- */
  function openFocus(id) {
    var q = findQuest(id);
    if (!q) return;
    var info = questInfo(q);
    var total = Math.max(5, Math.min(90, info.minutes || 25)) * 60;
    var left = total, paused = false, timer = null;
    var body = '<div class="wiz-d">' + esc(info.action) + '</div>' +
      '<div class="timer"><div class="t" id="f_t">' + mmss(left) + '</div><div class="s" id="f_s">专注中 · 手机放到够不到的地方</div></div>' +
      '<div class="btn-row"><button class="btn" id="f_pause">暂停</button><button class="btn primary" id="f_done">提前完成</button></div>' +
      '<button class="btn ghost block mt8" id="f_close">关闭（不结算）</button>';
    var sh = openSheet('专注 · ' + info.title, body, { locked: true, onClose: function () { clearInterval(timer); } });
    function tick() {
      left--;
      var t = $('#f_t', sh.sheet);
      if (t) t.textContent = mmss(Math.max(0, left));
      if (left <= 0) {
        clearInterval(timer);
        var s = $('#f_s', sh.sheet);
        if (s) s.textContent = '时间到 · 去结算';
        vibrate([30, 60, 30]); beep(880, 0.2);
      }
    }
    timer = setInterval(tick, 1000);
    UI.focusTimer = timer;
    $('#f_pause', sh.sheet).onclick = function () {
      paused = !paused;
      this.textContent = paused ? '继续' : '暂停';
      $('#f_s', sh.sheet).textContent = paused ? '已暂停' : '专注中 · 手机放到够不到的地方';
      if (paused) clearInterval(timer); else timer = setInterval(tick, 1000);
    };
    $('#f_done', sh.sheet).onclick = function () { clearInterval(timer); sh.close(); openSettle(id); };
    $('#f_close', sh.sheet).onclick = function () { clearInterval(timer); sh.close(); };
  }
  function mmss(sec) { return Math.floor(sec / 60) + ':' + ('0' + (sec % 60)).slice(-2); }

  function closeSheet() { if (UI.sheetClose) UI.sheetClose(); }

  /* ---------------- 引导 ---------------- */
  function renderOnboarding() {
    $('#app').classList.add('is-hidden');
    if (!UI.onb) {
      UI.onb = {
        step: 0, code: CORE.randomCodename(), cal: {}, targetId: 'intj_exec',
        difficulty: 'hardcore', resetHour: 4, credo: ['c1', 'c2', 'c3'], agreed: false
      };
    }
    var step = UI.onb.step;
    var wrap = document.createElement('div');
    wrap.className = 'onb';
    var total = 5;
    var prog = '';
    for (var i = 0; i < total; i++) prog += '<i class="' + (i <= step ? 'on' : '') + '"></i>';

    var body = '';
    if (step === 0) {
      body = '<h1>这不是日记。<br>这是角色档案。</h1>' +
        '<p>从今天起，你不再「处理情绪」，你在操作一个载体。<br>它会有属性、任务、残渣、战报和掉落。<br>你负责观测它、结算它、升级它。</p>' +
        '<div class="block"><h3>三条协议</h3><div class="d">① 用第三人称写观测 ② 情绪只是数据 ③ 行动先于感受</div>' +
        '<label style="font-size:11px;color:var(--muted)">载体代号</label>' +
        '<div style="display:flex;gap:8px;margin-top:5px"><input class="input" id="ob_code" maxlength="8" value="' + esc(UI.onb.code) + '" style="text-transform:uppercase">' +
        '<button class="btn" id="ob_dice">随机</button></div>' +
        '<div class="onb-note">代号用于战报与降临时显示。不要用真名。</div></div>' +
        '<div class="onb-foot"><button class="btn primary block" id="ob_next">建立连接</button>' +
        '<div class="onb-note center">所有数据只保存在这台设备。不联网、不上传。</div></div>';
    } else if (step === 1) {
      body = '<h1>你的市场长什么样</h1><p>任务会按你的真实战场生成。先选最接近的。</p>' +
        calBlock('line', '产品线') + calBlock('terminal', '主要终端') + calBlock('stage', '产品阶段') +
        '<div class="onb-foot"><button class="btn primary block" id="ob_next">下一步</button>' +
        '<button class="btn ghost block mt8" id="ob_skip">使用默认（处方药 / 三甲 / 上量期）</button></div>';
    } else if (step === 2) {
      body = '<h1>现实约束</h1><p>这会决定哪些任务能执行、哪些会自动换成替代路径。</p>' +
        calBlock('access', '医院对代表的管控') + calBlock('city', '城市线级') + calBlock('team', '团队风格') +
        calBlock('budget', '有可支配学术预算') +
        '<div class="block"><h3>每周可投入</h3><div class="d"><b id="ob_hv">' + (UI.onb.cal.hours || 7) + '</b> 小时</div>' +
        '<input type="range" id="ob_h" min="2" max="30" value="' + (UI.onb.cal.hours || 7) + '"></div>' +
        '<div class="onb-foot"><button class="btn primary block" id="ob_next">下一步</button></div>';
    } else if (step === 3) {
      body = '<h1>你要成为的形态</h1><p>目标不是口号，是 12 项可测属性。之后可改。</p>' +
        CONTENT.targetPresets.map(function (p) {
          return '<button class="block" data-preset="' + p.id + '" style="width:100%;text-align:left;border-color:' + (UI.onb.targetId === p.id ? 'var(--cyan)' : 'var(--line)') + '">' +
            '<div style="font-weight:700;font-size:14px">' + esc(p.name) + '</div><div class="d" style="margin:4px 0 0">' + esc(p.desc) + '</div></button>';
        }).join('') +
        '<div class="sec"><h2>机制硬度</h2></div><div class="seg" id="ob_diff">' +
        ['hardcore', 'standard', 'soft'].map(function (k) { return '<button class="' + (UI.onb.difficulty === k ? 'on' : '') + '" data-diff="' + k + '">' + CORE.DIFFICULTY[k].name + '</button>'; }).join('') + '</div>' +
        '<div class="onb-foot"><button class="btn primary block" id="ob_next">下一步</button></div>';
    } else {
      body = '<h1>签下载体协议</h1><p>选三条信条。它们会在每天接管时出现。</p>' +
        CONTENT.creeds.map(function (c) {
          return '<label class="checkline"><input type="checkbox" data-creed="' + c.id + '" ' + (UI.onb.credo.indexOf(c.id) >= 0 ? 'checked' : '') + '>' +
            '<span>' + esc(c.text) + '</span></label>';
        }).join('') +
        '<div class="block mt12"><label class="checkline"><input type="checkbox" id="ob_agree" ' + (UI.onb.agreed ? 'checked' : '') + '>' +
        '<span>我理解：这是角色档案，不是自我评价；它不替代医疗或心理治疗。</span></label></div>' +
        '<div class="onb-foot"><button class="btn primary block" id="ob_finish">进入载体</button>' +
        '<button class="btn ghost block mt8" id="ob_back">上一步</button></div>';
    }

    wrap.innerHTML = '<div class="onb-top"><div class="brand"><div class="brand-mark">V</div><div><div class="brand-id">载体协议</div><div class="brand-sub">VESSEL PROTOCOL</div></div></div>' +
      '<div class="onb-prog">' + prog + '</div></div>' +
      '<div class="onb-step">STEP ' + (step + 1) + ' / ' + total + '</div><div style="height:10px"></div>' + body;
    document.body.appendChild(wrap);
    if (UI.onbEl) UI.onbEl.remove();
    UI.onbEl = wrap;

    function calBlock(key, title) {
      var def = CONTENT.calibration[key];
      var cur = UI.onb.cal[key];
      return '<div class="block"><h3>' + esc(title) + '</h3><div class="onb-opt ' + (def.options.length > 4 ? 'three' : '') + '">' +
        def.options.map(function (o) {
          return '<button class="' + (String(cur) === String(o.v) ? 'on' : '') + '" data-cal="' + key + '" data-v="' + esc(String(o.v)) + '">' + esc(o.short || o.label) + '</button>';
        }).join('') + '</div></div>';
    }

    $$('[data-cal]', wrap).forEach(function (b) {
      b.onclick = function () { UI.onb.cal[b.getAttribute('data-cal')] = b.getAttribute('data-v') === 'true' ? true : b.getAttribute('data-v') === 'false' ? false : b.getAttribute('data-v'); renderOnboarding(); };
    });
    var code = $('#ob_code', wrap);
    if (code) code.oninput = function () { UI.onb.code = code.value.toUpperCase(); };
    var dice = $('#ob_dice', wrap);
    if (dice) dice.onclick = function () { UI.onb.code = CORE.randomCodename(); renderOnboarding(); };
    var h = $('#ob_h', wrap);
    if (h) h.oninput = function () { UI.onb.cal.hours = Number(h.value); var v = $('#ob_hv', wrap); if (v) v.textContent = h.value; };
    $$('[data-preset]', wrap).forEach(function (b) { b.onclick = function () { UI.onb.targetId = b.getAttribute('data-preset'); renderOnboarding(); }; });
    $$('[data-diff]', wrap).forEach(function (b) { b.onclick = function () { UI.onb.difficulty = b.getAttribute('data-diff'); renderOnboarding(); }; });
    $$('[data-creed]', wrap).forEach(function (b) {
      b.onchange = function () {
        var id = b.getAttribute('data-creed');
        if (b.checked) {
          if (UI.onb.credo.length >= 3) { b.checked = false; toast('最多选 3 条', 'bad'); return; }
          UI.onb.credo.push(id);
        } else UI.onb.credo = UI.onb.credo.filter(function (x) { return x !== id; });
      };
    });
    var agree = $('#ob_agree', wrap);
    if (agree) agree.onchange = function () { UI.onb.agreed = agree.checked; };
    var next = $('#ob_next', wrap);
    if (next) next.onclick = function () {
      if (step === 0) { if (!UI.onb.code.trim()) { toast('请填写代号', 'bad'); return; } UI.onb.step = 1; renderOnboarding(); return; }
      if (step === 1 || step === 2) { UI.onb.step++; renderOnboarding(); return; }
      UI.onb.step = 4; renderOnboarding();
    };
    var skip = $('#ob_skip', wrap);
    if (skip) skip.onclick = function () { UI.onb.step = 3; renderOnboarding(); };
    var back = $('#ob_back', wrap);
    if (back) back.onclick = function () { UI.onb.step = 3; renderOnboarding(); };
    var finish = $('#ob_finish', wrap);
    if (finish) finish.onclick = function () {
      if (!UI.onb.agreed) { toast('请先勾选理解声明', 'bad'); return; }
      finishOnboarding();
    };
  }

  function finishOnboarding() {
    var cal = Object.assign({ line: 'rx', terminal: 't3a', stage: 'growing', access: 'appointment', city: 't1', team: 'academic', hours: 7, budget: false }, UI.onb.cal);
    S = CORE.defaultState(Date.now());
    S.settings.difficulty = UI.onb.difficulty;
    S.settings.resetHour = 4;
    S.calibration = cal;
    S.character.codename = (UI.onb.code || 'V-07').slice(0, 8);
    S.character.credo = UI.onb.credo.slice(0, 3);
    for (var i = 0; i < CONTENT.targetPresets.length; i++) {
      if (CONTENT.targetPresets[i].id === UI.onb.targetId) {
        S.character.target = JSON.parse(JSON.stringify(CONTENT.targetPresets[i].target));
        S.character.targetName = CONTENT.targetPresets[i].name;
      }
    }
    S.meta.onboarded = true;
    save();
    if (UI.onbEl) { UI.onbEl.remove(); UI.onbEl = null; }
    UI.onb = null;
    UI.tab = 'panel';
    startApp();
    toast('载体已建立。今天只做一条，也算开始。', 'good');
  }

  /* ---------------- 全局绑定 ---------------- */
  var globalBound = false;
  function bindGlobal() {
    if (globalBound) return; globalBound = true;
    $('#tabbar').addEventListener('click', function (e) {
      var b = e.target.closest('[data-tab]');
      if (!b) return;
      UI.tab = b.getAttribute('data-tab'); render();
    });
    $('#fab').addEventListener('click', openQuick);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && S && S.meta.onboarded) {
        var evs = CORE.reconcile(S, Date.now());
        save(); render();
        evs.forEach(function (x) { toast(x.text, x.type === 'missed' ? 'bad' : 'good'); });
      }
    });
  }

  /* ---------------- 现场记录 ---------------- */
  function openQuick() {
    if (!S || !S.meta.onboarded) return;
    var body = '<div class="wiz-d">此刻发生了什么？用第三人称写，不写感受，只写事实。</div>' +
      '<div class="field"><label>观测（可空）</label><textarea class="input" id="q_obs" maxlength="80" placeholder="例：该载体在会议前反复看手机。"></textarea><div class="lint" id="q_lint"></div></div>' +
      '<div class="field"><label>情绪命名</label><div class="chips" id="q_emo">' +
      CONTENT.emotions.map(function (e) { return '<button class="chip sm" data-emo="' + esc(e) + '">' + esc(e) + '</button>'; }).join('') + '</div></div>' +
      '<div class="field"><label>强度 <b id="q_iv">5</b> / 10</label><input type="range" id="q_int" min="1" max="10" value="5"></div>' +
      '<div class="field"><label>裁决</label><div class="seg" id="q_verdict">' +
      CORE.URGE_VERDICTS.map(function (v, i) { return '<button class="' + (i === 2 ? 'on' : '') + '" data-vd="' + v.id + '">' + v.name + '</button>'; }).join('') + '</div></div>' +
      '<div class="field"><label>冲动（可选）</label><div class="chips" id="q_urge">' +
      CONTENT.urges.map(function (u) { return '<button class="chip sm" data-urge="' + esc(u) + '">' + esc(u) + '</button>'; }).join('') + '</div></div>' +
      '<button class="btn primary block" data-q="ok">记录 · +8 XP</button>';
    var sh = openSheet('现场记录', body);
    var q = { name: '', intensity: 5, verdict: 'delay', urge: '', obs: '' };
    $$('[data-emo]', sh.sheet).forEach(function (b) {
      b.onclick = function () {
        $$('[data-emo]', sh.sheet).forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on'); q.name = b.getAttribute('data-emo');
      };
    });
    $('#q_int', sh.sheet).oninput = function () { q.intensity = Number(this.value); $('#q_iv', sh.sheet).textContent = this.value; };
    $$('[data-vd]', sh.sheet).forEach(function (b) {
      b.onclick = function () { $$('[data-vd]', sh.sheet).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); q.verdict = b.getAttribute('data-vd'); };
    });
    $$('[data-urge]', sh.sheet).forEach(function (b) {
      b.onclick = function () { var on = b.classList.toggle('on'); q.urge = on ? b.getAttribute('data-urge') : ''; };
    });
    var obs = $('#q_obs', sh.sheet);
    obs.oninput = function () {
      q.obs = obs.value;
      var l = $('#q_lint', sh.sheet);
      if (!q.obs.trim()) { l.className = 'lint'; l.textContent = ''; return; }
      var r = CORE.lintObs(q.obs);
      l.className = r.ok ? 'lint ok' : 'lint bad';
      l.textContent = r.ok ? '通过。' : '出现第一人称/情绪直述：' + r.hits.map(function (h) { return h.text; }).join('、');
    };
    $('[data-q=ok]', sh.sheet).onclick = function () {
      if (!q.name) { toast('请先命名情绪', 'bad'); return; }
      if (q.obs && !CORE.lintObs(q.obs).ok) { toast('观测请改成第三人称', 'bad'); return; }
      CORE.quickLog(S, {
        name: q.name, intensity: q.intensity, halfLifeH: CONTENT.emotionHalfLife[q.name] || 24,
        urge: q.urge, verdict: q.verdict, reason: '', obs: q.obs, action: ''
      }, Date.now());
      CORE.checkSkills(S);
      save(); sh.close(); render();
      toast('已记录 · +8 XP · 残渣入库', 'good');
      vibrate(12);
    };
  }

  /* ---------------- 启动绑定 ---------------- */
  document.addEventListener('DOMContentLoaded', function () {
    boot();
    if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    }
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault(); UI.installPrompt = e;
    });
  });

  window.APP = { get state() { return S; }, render: render, save: save, core: CORE, content: CONTENT };
})();
