/* 载体协议 VESSEL — 基础内容库（校准 / 情绪 / 信条 / 技能 / 里程碑） */
(function (root) {
  'use strict';
  root.CONTENT = root.CONTENT || {};
  var C = root.CONTENT;

  C.contentVersion = '1.0';

  C.codenames = [
    'V-07', 'N-01', 'K-13', 'A-09', 'R-04', 'S-11', 'T-06', 'E-08',
    'L-12', 'M-03', 'D-05', 'X-10', 'Z-02', 'Q-14', 'W-15', 'Y-16'
  ];

  C.calibration = {
    line: {
      label: '产品线',
      hint: '只用于挑选任务变体，不收集任何客户信息',
      options: [
        { v: 'rx', label: '处方药', short: '处方药' },
        { v: 'device', label: '医疗器械 / 耗材', short: '器械' },
        { v: 'vaccine', label: '疫苗', short: '疫苗' },
        { v: 'otc', label: 'OTC / 消费健康', short: 'OTC' },
        { v: 'mixed', label: '混合 / 其他', short: '混合' }
      ]
    },
    terminal: {
      label: '主要终端',
      options: [
        { v: 't3a', label: '三甲医院', short: '三甲' },
        { v: 't2a', label: '二甲 / 二级医院', short: '二甲' },
        { v: 'community', label: '社区卫生中心', short: '社区' },
        { v: 'county', label: '县域 / 乡镇卫生院', short: '县域' },
        { v: 'retail', label: '零售药店 / DTP', short: '零售' },
        { v: 'mixed', label: '混合终端', short: '混合' }
      ]
    },
    stage: {
      label: '产品阶段',
      options: [
        { v: 'pre', label: '未准入 / 开发期', short: '开发期' },
        { v: 'growing', label: '已准入 / 上量期', short: '上量期' },
        { v: 'vbp', label: '集采品种', short: '集采' },
        { v: 'nrdl', label: '国谈品种', short: '国谈' },
        { v: 'selfpay', label: '自费 / 消费属性', short: '自费' }
      ]
    },
    access: {
      label: '医院对代表的管控',
      options: [
        { v: 'open', label: '相对开放，可正常预约拜访', short: '开放' },
        { v: 'appointment', label: '预约制，限时段/限区域', short: '预约制' },
        { v: 'restricted', label: '严格限制，基本只能线上/院外', short: '严格' },
        { v: 'closed', label: '基本禁入，只能靠线上与第三方会议', short: '禁入' }
      ]
    },
    city: {
      label: '城市线级',
      options: [
        { v: 't1', label: '一线', short: '一线' },
        { v: 'new1', label: '新一线', short: '新一线' },
        { v: 't23', label: '二三线', short: '二三线' },
        { v: 'county', label: '县域', short: '县域' }
      ]
    },
    team: {
      label: '团队风格',
      options: [
        { v: 'academic', label: '学术驱动', short: '学术' },
        { v: 'relationship', label: '关系驱动', short: '关系' },
        { v: 'mixed', label: '混合', short: '混合' }
      ]
    },
    budget: {
      label: '有可支配的学术预算',
      options: [
        { v: true, label: '有（会议/资料/差旅）', short: '有预算' },
        { v: false, label: '基本没有', short: '无预算' }
      ]
    },
    hours: { label: '每周可投入小时', min: 2, max: 30, step: 1 }
  };

  C.emotions = [
    '焦虑', '羞耻', '愤怒', '委屈', '恐惧', '嫉妒', '内疚', '失落',
    '烦躁', '无力', '孤独', '被冒犯', '不甘', '疲惫', '麻木', '紧绷',
    '尴尬', '被否定', '失控感', '比较心', '讨好冲动', '逃避冲动', '证明欲', '被看见的渴望'
  ];

  C.urges = [
    '想刷手机', '想抱怨', '想证明自己', '想逃避', '想吃', '想买',
    '想发火', '想讨好', '想控制', '想放弃', '想被认可', '想比较'
  ];

  C.emotionHalfLife = {
    '焦虑': 12, '羞耻': 48, '愤怒': 6, '委屈': 24, '恐惧': 24, '嫉妒': 36,
    '内疚': 36, '失落': 24, '烦躁': 8, '无力': 24, '孤独': 24, '被冒犯': 8,
    '不甘': 36, '疲惫': 8, '麻木': 24, '紧绷': 12, '尴尬': 8, '被否定': 36,
    '失控感': 24, '比较心': 24, '讨好冲动': 12, '逃避冲动': 8, '证明欲': 24, '被看见的渴望': 36
  };

  C.creeds = [
    { id: 'c1', text: '情绪是数据，不是指令。' },
    { id: 'c2', text: '肉身是载体，不是本体。' },
    { id: 'c3', text: '被激怒时，先问：这是谁的程序在运行？' },
    { id: 'c4', text: '不为感受辩护，只为结果负责。' },
    { id: 'c5', text: '把「我想要」改写成「该载体需要」。' },
    { id: 'c6', text: '疼痛是反馈，不是判决。' },
    { id: 'c7', text: '别人评价的是角色，不是你。' },
    { id: 'c8', text: '不解释，不证明，只呈现证据。' },
    { id: 'c9', text: '一切情绪都有半衰期，等它过去。' },
    { id: 'c10', text: '先行动，再谈感受。' },
    { id: 'c11', text: '优雅是控制信息密度，不是控制别人。' },
    { id: 'c12', text: '纪律不是压抑，是把能量导向目标。' }
  ];

  C.maintenance = [
    { id: 'm1', text: '24 小时维护：不结算、不刷任务、只睡觉与散步。' },
    { id: 'm2', text: '过载协议：把今日任务砍到 1 条微训练，其余全部延后。' },
    { id: 'm3', text: '疼痛协议：先处理身体，再处理情绪，最后处理任务。' },
    { id: 'm4', text: '社交耗尽：48 小时内不安排任何非必要会面。' },
    { id: 'm5', text: '失败日：只写一条战报，不修改任何属性。' },
    { id: 'm6', text: '情绪洪峰：离开现场 10 分钟，只做呼吸与步行。' },
    { id: 'm7', text: '比较心发作：关闭所有社媒 24 小时。' },
    { id: 'm8', text: '证明欲发作：今天不主动说任何一句关于自己的话。' },
    { id: 'm9', text: '睡眠债：今晚 22:30 前上床，任务清零。' },
    { id: 'm10', text: '季度检修：删掉一个不再服务于目标的习惯。' }
  ];

  C.reportTemplates = [
    '本周该载体完成 {tasks} 条任务，获得 {xp} XP；残渣转化率 {conv}%；连击 {streak} 天。',
    '观测窗口内，{domain} 域投入最多；薄弱项为 {weak}。',
    '本周驳回冲动 {rejected} 次；下一周只加一条高摩擦动作。',
    '该载体的证据链完整度 {evidence}%；无证据的任务不计入主线。',
    '与影子对手差距 {gap} XP；差距来自 {reason}。'
  ];

  C.milestones = [
    { id: 'ms_suit', name: '一套完全合身的西装', desc: '找裁缝改到肩线、袖长、裤长都对。', attr: 'img' },
    { id: 'ms_body15', name: '体脂 ≤ 15%', desc: '以同一台体脂秤/同一时间测量为准。', attr: 'vit' },
    { id: 'ms_sleep30', name: '连续 30 天睡眠 ≥ 7h', desc: '以手环或手机睡眠记录为准。', attr: 'vit' },
    { id: 'ms_pitch', name: '30 秒电梯陈述脱稿', desc: '录音 3 次，均在 35 秒内讲清价值。', attr: 'pre' },
    { id: 'ms_meeting', name: '独立主讲一次学术会', desc: '院内、线上或第三方会议均可，需有纪要。', attr: 'imp' },
    { id: 'ms_report', name: '向总监级做一次汇报', desc: 'SCQA 结构，10 分钟内讲完。', attr: 'imp' },
    { id: 'ms_speech', name: '一次 10 分钟公开表达', desc: '年会、培训、行业沙龙均可。', attr: 'pre' },
    { id: 'ms_teeth', name: '完成牙齿治疗/美白', desc: '牙龈健康、颜色与排列可被看见。', attr: 'img' },
    { id: 'ms_groom60', name: '连续 60 天仪容打卡', desc: '发型、皮肤、指甲、气味四项。', attr: 'img' },
    { id: 'ms_capsule', name: '建立 12 件胶囊衣橱', desc: '可互相搭配，覆盖 80% 工作场景。', attr: 'tas' },
    { id: 'ms_fund', name: '6 个月应急金', desc: '单独账户，不动用。', attr: 'fin' },
    { id: 'ms_rel5', name: '维护 5 位关键关系 6 个月', desc: '每月至少一次有价值的互动。', attr: 'rel' }
  ];

  C.targetPresets = [
    {
      id: 'intj_exec',
      name: '高阶 INTJ · 优雅高管',
      desc: '理性、克制、有审美、有存在感；不靠声量靠结构。',
      target: { pro: 80, imp: 80, res: 70, vit: 75, img: 80, pre: 80, int: 85, wil: 85, cal: 85, tas: 75, rel: 70, fin: 70 },
      signature: ['30 秒讲清价值', '独立主讲学术会', '体脂 15% 且体态挺拔', '一套合身西装与稳定气味', '被冒犯时 6 秒沉默']
    },
    {
      id: 'top_rep',
      name: '区域王牌代表',
      desc: '专业、可信、能拿下最难的市场。',
      target: { pro: 85, imp: 85, res: 80, vit: 65, img: 65, pre: 70, int: 75, wil: 75, cal: 70, tas: 55, rel: 70, fin: 60 },
      signature: ['关键人地图完整', '区域策略可复盘', '异议处理不辩解']
    },
    {
      id: 'gentleman',
      name: '优雅个体',
      desc: '外在、品味、关系与定力优先。',
      target: { pro: 60, imp: 60, res: 55, vit: 80, img: 85, pre: 85, int: 70, wil: 70, cal: 80, tas: 85, rel: 75, fin: 60 },
      signature: ['体态与声音稳定', '衣橱可搭配', '餐桌与社交礼仪']
    }
  ];

  /* 技能树：4 域 × 3 支 × 5 层 = 60 节点 */
  function branch(domain, key, prefix, names, descs, buff) {
    var out = [];
    names.forEach(function (name, i) {
      out.push({
        id: prefix + '_' + (i + 1),
        domain: domain,
        branch: key,
        tier: i + 1,
        name: name,
        desc: descs[i],
        req: { attr: buff.attr, value: [8, 15, 25, 40, 60][i] },
        buff: { domain: domain, mult: 0.02 }
      });
    });
    return out;
  }

  C.skills = [].concat(
    branch('career', '学术力', 'sk_pro', ['读文献', '讲证据', '建框架', '做主讲', '成权威'],
      ['每周读 1 篇摘要', '能用 1 页讲清 1 个终点', '把产品放进疾病路径', '独立完成一场学术会', '被客户当作可咨询的人'], { attr: 'pro' }),
    branch('career', '商业力', 'sk_res', ['算清账', '画地图', '配资源', '做取舍', '造系统'],
      ['算清辖区潜力与产出', '画出关键人地图', '把预算投向最高杠杆', '敢于放弃低效客户', '让区域自己运转'], { attr: 'res' }),
    branch('career', '影响力', 'sk_imp', ['先听后说', '异议前置', '结论先行', '跨部门', '不怒自威'],
      ['一次拜访只问 3 个问题', '主动说出对方顾虑', '30 秒讲完结论', '让其他部门愿意配合', '沉默也有重量'], { attr: 'imp' }),

    branch('body', '力量', 'sk_vit', ['站直', '练腿', '规律睡', '控体脂', '耐造'],
      ['每天靠墙站 3 分钟', '每周 2 次下肢训练', '固定起床时间', '体脂进入 18% 以下', '连续 30 天无疼痛日'], { attr: 'vit' }),
    branch('body', '形象', 'sk_img', ['干净', '合身', '体态', '风格', '质感'],
      ['发型/指甲/气味稳定', '衣服肩线合身', '圆肩与颈前伸改善', '建立个人色彩', '一眼被记住但不刺眼'], { attr: 'img' }),
    branch('body', '气场', 'sk_pre', ['稳声', '敢停', '眼神', '镜头', '场域'],
      ['说话降半调', '敢在句中停 2 秒', '对视 3 秒不躲', '镜头前不僵硬', '进入房间就被注意到'], { attr: 'pre' }),

    branch('mind', '思维', 'sk_int', ['写下来', '找反例', '二阶', '建模型', '预演'],
      ['每天一条决策日志', '主动找反证', '问「然后呢」三次', '形成自己的决策清单', '季度预言并复盘'], { attr: 'int' }),
    branch('mind', '执行', 'sk_wil', ['开始', '做完', '抗扰', '硬启动', '自动'],
      ['2 分钟内开始', '一次只做一件事', '关闭通知 25 分钟', '不想做也先做 5 分钟', '把行动变成默认'], { attr: 'wil' }),
    branch('mind', '定力', 'sk_cal', ['识别', '命名', '等待', '重构', '不动'],
      ['情绪来时先标记', '说出它的名字', '等 6 秒再回应', '换一个解释框架', '被冒犯也不失态'], { attr: 'cal' }),

    branch('life', '审美', 'sk_tas', ['看', '挑', '配', '留白', '风格'],
      ['每天分析 1 张好图', '买少而好', '让三件物品互相呼应', '桌面只留必要之物', '形成可识别的品味'], { attr: 'tas' }),
    branch('life', '关系', 'sk_rel', ['在场', '记得', '边界', '深谈', '长期'],
      ['与人说话不看手机', '记住对方一个细节', '敢说「不」', '每月一次深度对话', '维护 5 位十年关系'], { attr: 'rel' }),
    branch('life', '财商', 'sk_fin', ['记账', '储蓄', '保险', '配置', '自由'],
      ['连续 30 天记账', '先存后花', '补齐医疗/重疾/意外', '做一次资产配置', '应急金覆盖 6 个月'], { attr: 'fin' })
  );

  C.titles = [
    { lv: 1, name: '观察体' }, { lv: 10, name: '执行体' }, { lv: 20, name: '猎手' },
    { lv: 30, name: '策士' }, { lv: 40, name: '破局者' }, { lv: 50, name: '掌控者' },
    { lv: 60, name: '造物者' }, { lv: 70, name: '不可名状' }
  ];

  C.supplies = [
    { id: 'reroll', name: '换牌券', desc: '重抽今日日常与挑战', cost: 1 },
    { id: 'shield', name: '连击护盾', desc: '断链时保留一次连击', cost: 3 },
    { id: 'focus', name: '专注卡', desc: '一次任务 XP +20%', cost: 2 },
    { id: 'cleanse', name: '清残卡', desc: '一条残渣强度 -3', cost: 2 }
  ];

  C.recoveryProtocols = [
    '今晚 23:00 前睡，不做任何结算。',
    '明天只做一条微训练，其余全部延后。',
    '48 小时内不安排非必要社交。',
    '把当前最强的残渣写出来，只写事实。',
    '出门走 20 分钟，不带耳机。'
  ];
})(typeof globalThis !== 'undefined' ? globalThis : this);
