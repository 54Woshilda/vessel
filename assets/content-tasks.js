/* 载体协议 VESSEL — 任务族 × 变体 × 微训练 */
(function (root) {
  'use strict';
  root.CONTENT = root.CONTENT || {};
  var C = root.CONTENT;

  function v(id, label, action, evidence, extra) {
    var o = { id: id, label: label, action: action, evidence: evidence };
    if (extra) for (var k in extra) o[k] = extra[k];
    return o;
  }

  C.taskFamilies = [
    /* ================= 职业 14 ================= */
    {
      id: 'visit_prep', domain: 'career', attr: 'res', secondary: 'pro',
      title: '拜访前情报', goal: '见客户前，用 1 页纸建立信息优势', tier: 1, minutes: 20,
      tags: ['prep'],
      compliance: '只收集公开与合规信息；不打听患者隐私，不获取医生个人处方量。',
      variants: [
        v('vp_open', '院内版', '查门诊/病房排班与近 3 个月科室动态，选 1 篇客户可能关心的文献，写下 3 个问题与 1 个切入点。', '1 页情报卡：3 个问题 + 1 个切入点', { when: { access: ['open', 'appointment'] }, minutes: 20 }),
        v('vp_restricted', '院外版', '不进入诊疗区域：从公开会议、医院公众号、同事复盘、线上平台收集，写成 3 个问题。', '1 页情报卡（注明来源）', { when: { access: ['restricted', 'closed'] }, minutes: 25 }),
        v('vp_retail', '门店版', '查门店动销、库存、店员结构与竞品陈列，写下 3 个问题。', '1 页门店情报卡', { when: { terminal: ['retail'] }, minutes: 20 }),
        v('vp_min', '最小版', '只写 1 个问题 + 1 个可能的切入点，不追求完整。', '1 句话情报', { minutes: 8 })
      ]
    },
    {
      id: 'one_on_one', domain: 'career', attr: 'imp', secondary: 'pro',
      title: '预约学术拜访', goal: '完成一次有下一步的 1v1 学术传递', tier: 2, minutes: 45,
      tags: ['visit'],
      compliance: '遵守备案、预约与医院接待规定；不进诊室、不提供不当利益。',
      variants: [
        v('oo_in', '院内预约版', '预约 15 分钟：1 个核心信息 + 1 个问题 + 1 个明确下一步（资料/会议/再访）。', '客户一句反馈或一个下一步承诺', { when: { access: ['open', 'appointment'] }, minutes: 40 }),
        v('oo_out', '院外/线上版', '改到院外或线上 15 分钟，结构不变；若只能线上，控制在 10 分钟。', '会议截图或客户反馈', { when: { access: ['restricted', 'closed'] }, minutes: 40 }),
        v('oo_retail', '店员版', '给 1-2 名店员做 5 分钟核心信息传递，问 1 个推荐场景。', '店员复述一句核心信息', { when: { terminal: ['retail'] }, minutes: 30 }),
        v('oo_min', '最小版', '只发 1 条有价值的信息，附 1 个问题，不要求见面。', '对方回复', { minutes: 10 })
      ]
    },
    {
      id: 'dept_meeting', domain: 'career', attr: 'imp', secondary: 'pro',
      title: '科室会族', goal: '完成一次可验证的学术信息传递，而不是「办一场会」', tier: 3, minutes: 60,
      tags: ['academic', 'hard'],
      compliance: '不提供餐费/礼品/旅游；不进诊室；遵守医院与公司合规审批。',
      variants: [
        v('dm_in', '院内小会版', '预约 3-5 位客户，15 分钟单页文献 + 1 个临床问题；会前发议程，会后 24h 跟进。', '会议纪要或截图 + 1 句客户反馈', { when: { access: ['open', 'appointment'], budget: true }, minutes: 60 }),
        v('dm_online', '线上版', '线上 20 分钟，讲 1 篇 RCT；会前议程、会后 1v1 跟进。', '会议截图 + 1 条会后消息', { when: { access: ['restricted', 'closed'] }, minutes: 50 }),
        v('dm_nobudget', '借会版', '借学会/第三方会议的会前 1v1，做 5 分钟单页传递。', '会前沟通记录 + 1 句反馈', { when: { budget: false }, minutes: 45 }),
        v('dm_intel', '降级情报版', '无法组织会议时：画科室关键人地图 + 收集竞品 3 条动态。', '地图或 3 条动态', { minutes: 40 })
      ]
    },
    {
      id: 'kol_map', domain: 'career', attr: 'res', secondary: 'int',
      title: '关键人地图', goal: '把「谁说了算」画出来，而不是猜', tier: 2, minutes: 40,
      tags: ['strategy'],
      variants: [
        v('km_full', '五类角色版', '画 5 类角色：决策/影响/使用/反对/信息；每人类注关系强度 1-5 与下一步。', '一张地图（照片或文字）', { minutes: 40 }),
        v('km_retail', '门店版', '画店长/店员/采购/药师/常客五类，标注谁真正影响推荐。', '一张门店地图', { when: { terminal: ['retail'] }, minutes: 30 }),
        v('km_min', '三人版', '只画 3 个人，但每人写 1 个「未验证假设」。', '3 人 + 3 个假设', { minutes: 15 })
      ]
    },
    {
      id: 'competitor_intel', domain: 'career', attr: 'int', secondary: 'pro',
      title: '竞品动态', goal: '用可验证的信息替代道听途说', tier: 1, minutes: 25,
      tags: ['intel'],
      compliance: '只使用公开渠道；不窃取商业机密，不诱导他人违规提供信息。',
      variants: [
        v('ci_public', '公开渠道版', '收集 3 条可验证动态（适应症/价格/会议/代表动作），每条写来源与可信度。', '3 条动态 + 来源', { minutes: 25 }),
        v('ci_field', '一线版', '从 2 位客户或同事处收集 3 条动态，标注「谁说的/能否验证」。', '3 条 + 验证状态', { when: { access: ['open', 'appointment'] }, minutes: 30 }),
        v('ci_min', '一条版', '只追 1 条最影响你下週动作的动态，写清它改变了什么。', '1 条 + 1 个动作变化', { minutes: 10 })
      ]
    },
    {
      id: 'objection', domain: 'career', attr: 'imp', secondary: 'cal',
      title: '异议处理演练', goal: '被质疑时不辩解，先结构', tier: 2, minutes: 30,
      tags: ['drill'],
      variants: [
        v('ob_full', '三异议版', '写下客户最常说的 3 个异议，用「认同-澄清-证据-下一步」各写 1 版；找同事角色扮演 10 分钟。', '3 段话术 + 1 次演练记录', { minutes: 30 }),
        v('ob_solo', '独练版', '对镜/录音各说 1 遍，回听时只找「有没有辩解」。', '1 段录音 + 1 条自评', { minutes: 15 }),
        v('ob_min', '一句版', '只写 1 句最容易被激怒时的缓冲句。', '1 句缓冲句', { minutes: 5 })
      ]
    },
    {
      id: 'evidence_study', domain: 'career', attr: 'pro',
      title: '循证学习', goal: '把文献变成能讲出口的 3 行', tier: 1, minutes: 40,
      tags: ['study'],
      variants: [
        v('es_paper', '摘要版', '读 1 篇指南/RCT 摘要，写 3 行：结论/适用人群/局限。', '3 行笔记', { minutes: 35 }),
        v('es_vbp', '集采版', '在 3 行之外，加 1 条「集采后如何讲价值」。', '3 行 + 1 条价值话术', { when: { stage: ['vbp'] }, minutes: 40 }),
        v('es_min', '一页版', '只读 1 页，摘 1 个能立刻用的数字。', '1 个数字 + 出处', { minutes: 10 })
      ]
    },
    {
      id: 'access_work', domain: 'career', attr: 'res', secondary: 'imp',
      title: '准入推进', goal: '找到流程里的 1 个可推动节点', tier: 3, minutes: 60,
      tags: ['access', 'hard'],
      compliance: '遵守医院药事与反腐规定；不接触不该接触的人，不走非正式渠道。',
      variants: [
        v('ac_pre', '开发期版', '画准入流程 5 个节点，标出关键人、当前卡点、你能做的 1 个合规动作。', '1 页流程 + 1 个下一步', { when: { stage: ['pre'] }, minutes: 60 }),
        v('ac_grow', '上量期版', '列出 3 个上量障碍（处方习惯/医保/竞品/科室流程），选 1 个本周能动的。', '3 个障碍 + 1 个动作', { when: { stage: ['growing', 'nrdl', 'vbp', 'selfpay'] }, minutes: 40 }),
        v('ac_min', '最小版', '只确认 1 个卡点与 1 个负责人，不展开。', '1 个卡点 + 1 个名字', { minutes: 15 })
      ]
    },
    {
      id: 'territory_plan', domain: 'career', attr: 'int', secondary: 'res',
      title: '区域策略', goal: '把时间投向高杠杆客户', tier: 2, minutes: 45,
      tags: ['strategy'],
      variants: [
        v('tp_matrix', '3×3 版', '按「潜力×关系」把客户分 3×3，选 5 个重点，写本周各 1 个动作。', '一张分级表 + 5 个动作', { minutes: 45 }),
        v('tp_retail', '门店版', '按「动销×配合度」分 3×3，选 5 家重点门店。', '门店分级表', { when: { terminal: ['retail'] }, minutes: 35 }),
        v('tp_min', '一人版', '只选 1 个本周必须拿下的客户，写 3 个动作。', '1 人 + 3 个动作', { minutes: 10 })
      ]
    },
    {
      id: 'report_up', domain: 'career', attr: 'imp', secondary: 'int',
      title: '向上汇报', goal: '用 SCQA 让上级 1 分钟听懂', tier: 2, minutes: 30,
      tags: ['communication'],
      variants: [
        v('ru_scqa', '一页版', '写 1 页：结论/背景/冲突/问题/下一步；至少 1 个可量化结果。', '1 页 SCQA', { minutes: 30 }),
        v('ru_oral', '口头版', '对镜练 90 秒版本，录音回听，删掉所有铺垫。', '1 段 90 秒录音', { minutes: 15 }),
        v('ru_min', '一句话版', '只写「结论 + 需要上级做的一个决定」。', '1 句话', { minutes: 5 })
      ]
    },
    {
      id: 'cross_dept', domain: 'career', attr: 'imp',
      title: '跨部门协作', goal: '让其他部门愿意为你动一次', tier: 2, minutes: 30,
      tags: ['collaboration'],
      variants: [
        v('cd_ask', '具体请求版', '找 1 个协作点（市场/医学/准入/商务），提出 1 个具体、可拒绝的请求。', '对方回复或约定', { minutes: 30 }),
        v('cd_give', '先给版', '先给对方 1 个有用信息，再提请求。', '1 次信息交换记录', { minutes: 25 }),
        v('cd_min', '一条版', '只发 1 条消息，问对方当前最缺什么。', '1 条回复', { minutes: 8 })
      ]
    },
    {
      id: 'retail_visit', domain: 'career', attr: 'imp', secondary: 'res',
      title: '零售 / DTP 走访', goal: '让门店愿意替你说话', tier: 2, minutes: 45,
      tags: ['retail'],
      variants: [
        v('rv_two', '两店版', '走访 2 家门店：看陈列/库存/竞品，做 1 次 5 分钟店员培训，留 1 个问题。', '门店照片 + 店员反馈', { when: { terminal: ['retail', 'mixed'] }, minutes: 45 }),
        v('rv_one', '一店版', '只走访 1 家，完成「陈列检查 + 1 句推荐话术」。', '1 张照片 + 1 句话术', { minutes: 25 }),
        v('rv_min', '电话版', '电话店长 5 分钟，问库存与推荐障碍。', '1 条记录', { minutes: 8 })
      ]
    },
    {
      id: 'county_expansion', domain: 'career', attr: 'res', secondary: 'imp',
      title: '三终端拓展', goal: '在县域/社区找到 1 个可复制的合作点', tier: 3, minutes: 60,
      tags: ['expansion', 'hard'],
      variants: [
        v('ce_visit', '实地版', '选 1 家卫生院/社区，做 10 分钟需求访谈，写 1 个可执行合作点。', '访谈记录 + 1 个合作点', { when: { terminal: ['county', 'community', 'mixed'] }, minutes: 60 }),
        v('ce_phone', '电话版', '电话 1 家，问 3 个问题：患者来源/用药痛点/最缺什么支持。', '3 个答案', { minutes: 20 }),
        v('ce_map', '地图版', '列出 10 家潜在终端，按「距离×意愿×能力」排序，选 3 家。', '1 张排序表', { minutes: 30 })
      ]
    },
    {
      id: 'conference', domain: 'career', attr: 'pro', secondary: 'imp',
      title: '学术会议跟进', goal: '把一次会议变成 3 个关系与 1 个动作', tier: 2, minutes: 40,
      tags: ['academic'],
      compliance: '遵守会议合规与公司差旅标准；不借会议名义提供不当利益。',
      variants: [
        v('cf_full', '全程版', '会前约 1 位讲者/客户，会中提 1 个问题，会后 24h 发 1 条总结。', '会后消息 + 1 个新联系人', { minutes: 45 }),
        v('cf_online', '线上版', '线上参会：记 1 个关键数据，发给 2 位客户并附 1 个问题。', '2 条发送记录', { minutes: 25 }),
        v('cf_min', '复盘版', '只看会议议程，写 1 条对你区域有用的信息。', '1 条信息', { minutes: 10 })
      ]
    },

    /* ================= 机体 8 ================= */
    {
      id: 'strength', domain: 'body', attr: 'vit', secondary: 'wil',
      title: '力量训练', goal: '让载体更耐造，而不是更好看', tier: 2, minutes: 45,
      tags: ['training'],
      variants: [
        v('st_gym', '健身房版', '下肢/推/拉各 3 组，最后 1 组留 2 次余力；记录重量。', '训练记录（动作/重量/组数）', { minutes: 50 }),
        v('st_home', '居家版', '深蹲/俯卧撑/臀桥/平板各 3 组，组间 60 秒。', '训练记录', { minutes: 25 }),
        v('st_min', '最小版', '20 个深蹲 + 30 秒平板，做完即可。', '1 条打卡', { minutes: 5 })
      ]
    },
    {
      id: 'sleep', domain: 'body', attr: 'vit', secondary: 'cal',
      title: '睡眠修复', goal: '固定起床时间，比睡够更重要', tier: 1, minutes: 20,
      tags: ['recovery'],
      variants: [
        v('sl_fix', '固定起床版', '设一个 7 天不变的起床时间；睡前 30 分钟无屏。', '起床时间截图', { minutes: 20 }),
        v('sl_debt', '补债版', '今晚提前 45 分钟上床，不做任何任务。', '上床时间记录', { minutes: 10 }),
        v('sl_min', '最小版', '只做一件事：把手机放到够不到的地方。', '1 条打卡', { minutes: 3 })
      ]
    },
    {
      id: 'cardio', domain: 'body', attr: 'vit',
      title: '有氧 / 体脂', goal: '把体脂变成可测量的数字', tier: 2, minutes: 30,
      tags: ['training'],
      variants: [
        v('ca_zone2', 'Zone2 版', '25 分钟快走/慢跑/单车，能说短句但不舒服。', '心率或时长记录', { minutes: 30 }),
        v('ca_steps', '步数版', '今天走到 8000 步，分 3 次完成。', '步数截图', { minutes: 40 }),
        v('ca_min', '最小版', '10 分钟快走，不看手机。', '1 条打卡', { minutes: 10 })
      ]
    },
    {
      id: 'posture', domain: 'body', attr: 'img', secondary: 'vit',
      title: '体态矫正', goal: '先站直，再谈气质', tier: 1, minutes: 15,
      tags: ['posture'],
      variants: [
        v('po_full', '三件套', '靠墙站 3 分钟 + 胸椎伸展 10 次 + 臀桥 15 次。', '1 条打卡', { minutes: 15 }),
        v('po_desk', '办公版', '每坐 50 分钟起身 2 分钟：收下巴、开胸、走一圈。', '3 次起身记录', { minutes: 6 }),
        v('po_min', '一张照片', '拍一张侧面站姿，标出颈前伸/圆肩。', '1 张照片', { minutes: 3 })
      ]
    },
    {
      id: 'grooming', domain: 'body', attr: 'img',
      title: '仪容维护', goal: '干净、整齐、无异味，是最低成本的尊重', tier: 1, minutes: 20,
      tags: ['grooming'],
      variants: [
        v('gr_full', '四项版', '发型/皮肤/牙齿/指甲/气味，五项逐项检查并处理一项。', '1 张清单 + 1 张自拍', { minutes: 25 }),
        v('gr_quick', '出门版', '出门前 3 分钟：衣领、鼻毛、指甲、口气。', '1 条打卡', { minutes: 3 }),
        v('gr_book', '预约版', '预约一次理发/洗牙/皮肤科，定下日期。', '预约截图', { minutes: 10 })
      ]
    },
    {
      id: 'wardrobe', domain: 'body', attr: 'img', secondary: 'tas',
      title: '穿搭与合身', goal: '衣服服务角色，不是表达心情', tier: 2, minutes: 30,
      tags: ['style'],
      variants: [
        v('wd_capsule', '胶囊版', '用 12 件单品搭 3 套工作装，拍照存档。', '3 张搭配照', { minutes: 40 }),
        v('wd_fit', '合身版', '检查肩线/袖长/裤长/腰围，标记 1 件要改的衣服。', '1 张标记图', { minutes: 20 }),
        v('wd_min', '一套版', '只搭好明天要穿的一套，挂出来。', '1 张照片', { minutes: 8 })
      ]
    },
    {
      id: 'voice', domain: 'body', attr: 'pre',
      title: '声音训练', goal: '降半调、放慢、敢停', tier: 1, minutes: 15,
      tags: ['voice'],
      variants: [
        v('vo_record', '录音版', '录 30 秒自我介绍/产品陈述，回听只找「语速、尾音、填充词」。', '1 段录音 + 1 条自评', { minutes: 15 }),
        v('vo_breath', '呼吸版', '腹式呼吸 2 分钟 + 朗读 3 分钟，句末降调。', '1 条打卡', { minutes: 8 }),
        v('vo_min', '一句话', '把一句常用开场白说 5 遍，每遍慢 10%。', '5 遍计数', { minutes: 4 })
      ]
    },
    {
      id: 'presence', domain: 'body', attr: 'pre', secondary: 'cal',
      title: '气场 / 存在感', goal: '不靠声量，靠稳定', tier: 2, minutes: 20,
      tags: ['presence'],
      variants: [
        v('pr_eye', '眼神版', '对镜练 3 秒对视 + 2 秒停顿，录 1 分钟。', '1 段录像', { minutes: 15 }),
        v('pr_enter', '入场版', '下次进会议室：停 2 秒、扫视、再坐下；记录感受。', '1 条记录', { minutes: 10 }),
        v('pr_min', '站姿版', '靠墙站 3 分钟，只关注肩胛骨与下巴。', '1 条打卡', { minutes: 4 })
      ]
    },

    /* ================= 心智 8 ================= */
    {
      id: 'decision_log', domain: 'mind', attr: 'int',
      title: '决策日志', goal: '把决策从直觉变成可复盘资产', tier: 1, minutes: 15,
      tags: ['thinking'],
      variants: [
        v('dl_full', '五栏版', '写：决策/备选/依据/预期结果/复盘日期。', '1 条日志', { minutes: 15 }),
        v('dl_quick', '三栏版', '只写：选了什么/放弃了什么/三个月后怎么判断对错。', '1 条日志', { minutes: 6 }),
        v('dl_min', '一句版', '写今天一个决定 + 一个反例。', '1 句话', { minutes: 3 })
      ]
    },
    {
      id: 'second_order', domain: 'mind', attr: 'int',
      title: '二阶思考', goal: '问三次「然后呢」', tier: 2, minutes: 20,
      tags: ['thinking'],
      variants: [
        v('so_three', '三阶版', '对当前一个难题，连问 3 次「然后呢」，写出第三层后果。', '3 层推演', { minutes: 20 }),
        v('so_premortem', '预演失败版', '假设 6 个月后失败，写 3 个最可能原因与 1 个预防动作。', '3 个原因 + 1 个动作', { minutes: 15 }),
        v('so_min', '一句版', '只写「如果这样做，最坏的二阶后果是什么」。', '1 句话', { minutes: 5 })
      ]
    },
    {
      id: 'deep_work', domain: 'mind', attr: 'wil', secondary: 'int',
      title: '深度工作', goal: '一次只做一件事，至少 50 分钟', tier: 2, minutes: 50,
      tags: ['focus'],
      variants: [
        v('dw_50', '50 分钟版', '关通知，计时 50 分钟，只做一件有产出的事。', '计时截图 + 产出', { minutes: 50 }),
        v('dw_25', '25 分钟版', '番茄钟 1 个，中途不切窗口。', '计时截图', { minutes: 25 }),
        v('dw_min', '10 分钟版', '只做 10 分钟，但手机放到另一个房间。', '1 条打卡', { minutes: 10 })
      ]
    },
    {
      id: 'urge_drill', domain: 'mind', attr: 'wil', secondary: 'cal',
      title: '冲动驳回', goal: '在想要的那一刻，练习不执行', tier: 2, minutes: 10,
      tags: ['willpower'],
      variants: [
        v('ud_wait', '10 分钟版', '想刷/想吃/想买时，先等 10 分钟，只观察冲动强度变化。', '1 条记录：前/后强度', { minutes: 10 }),
        v('ud_write', '书写版', '写下冲动原话，改写成「该载体需要…」。', '1 条改写', { minutes: 8 }),
        v('ud_min', '一次版', '今天只驳回 1 次最小的冲动。', '1 条打卡', { minutes: 3 })
      ]
    },
    {
      id: 'stress_inoculation', domain: 'mind', attr: 'cal', secondary: 'wil',
      title: '压力接种', goal: '在安全剂量下，练习不被淹没', tier: 3, minutes: 30,
      tags: ['hard', 'calm'],
      variants: [
        v('si_cold', '冷暴露版', '30 秒冷水澡结尾，只观察身体反应，不评判。', '1 条记录', { minutes: 10 }),
        v('si_speak', '表达版', '主动争取一次当众发言/提问，记录被注视时的身体反应。', '1 条记录', { minutes: 30 }),
        v('si_hold', '屏息版', '做 3 轮 4-4-6 呼吸（吸 4/停 4/呼 6），不追求极限。', '1 条打卡', { minutes: 8 })
      ]
    },
    {
      id: 'recovery', domain: 'mind', attr: 'cal',
      title: '恢复协议', goal: '恢复也是训练的一部分', tier: 1, minutes: 20,
      tags: ['recovery'],
      variants: [
        v('rc_walk', '步行版', '20 分钟无耳机步行，只观察环境。', '1 条记录', { minutes: 20 }),
        v('rc_nap', '小睡版', '15 分钟闭眼，不刷手机。', '1 条打卡', { minutes: 15 }),
        v('rc_min', '呼吸版', '4-7-8 呼吸 4 轮。', '1 条打卡', { minutes: 4 })
      ]
    },
    {
      id: 'value_clarify', domain: 'mind', attr: 'cal', secondary: 'int',
      title: '价值澄清', goal: '知道什么不可交易', tier: 2, minutes: 20,
      tags: ['values'],
      variants: [
        v('vc_list', '清单版', '写 5 条「不可交易」，每条配 1 个最近的行为证据。', '5 条 + 证据', { minutes: 20 }),
        v('vc_case', '案例版', '回想一次你违背价值的时刻，写当时的选择与代价。', '1 个案例', { minutes: 15 }),
        v('vc_min', '一条版', '只写 1 条今天没有妥协的事。', '1 条', { minutes: 5 })
      ]
    },
    {
      id: 'writing', domain: 'mind', attr: 'int', secondary: 'pre',
      title: '写作 / 表达', goal: '把想法压缩成可传播的结构', tier: 2, minutes: 25,
      tags: ['writing'],
      variants: [
        v('wr_300', '300 字版', '写 300 字：一个判断 + 三个理由 + 一个反例。', '300 字', { minutes: 25 }),
        v('wr_post', '公开版', '发一条公开内容（行业观察/读书笔记），不求赞。', '发布截图', { minutes: 20 }),
        v('wr_min', '一句版', '把今天最重要的事压成 1 句话。', '1 句话', { minutes: 3 })
      ]
    },

    /* ================= 生活 8 ================= */
    {
      id: 'aesthetic_daily', domain: 'life', attr: 'tas',
      title: '每日一图 / 一物', goal: '训练眼睛，而不是收集图片', tier: 1, minutes: 10,
      tags: ['taste'],
      variants: [
        v('ad_image', '图像版', '选 1 张好图，写 3 行：它好在哪/用了什么手法/你能用在哪。', '3 行分析', { minutes: 10 }),
        v('ad_object', '物品版', '观察身边 1 件物品，写材质/比例/颜色/工艺。', '3 行分析', { minutes: 8 }),
        v('ad_min', '一句版', '只写「今天看到的最好的一个细节」。', '1 句话', { minutes: 3 })
      ]
    },
    {
      id: 'reading', domain: 'life', attr: 'tas', secondary: 'int',
      title: '阅读', goal: '读少一点，用多一点', tier: 1, minutes: 30,
      tags: ['reading'],
      variants: [
        v('rd_20', '20 页版', '读 20 页，写 1 个可用的观点。', '1 条笔记', { minutes: 30 }),
        v('rd_essay', '长文版', '读 1 篇长文，用 3 句话复述。', '3 句话', { minutes: 20 }),
        v('rd_min', '一页版', '只读 1 页，摘 1 句。', '1 句摘录', { minutes: 5 })
      ]
    },
    {
      id: 'money', domain: 'life', attr: 'fin',
      title: '财务动作', goal: '让钱服务于自由，而不是情绪', tier: 2, minutes: 20,
      tags: ['finance'],
      variants: [
        v('mo_track', '记账版', '记完今天所有支出，标出 1 笔「情绪消费」。', '1 张记账截图', { minutes: 10 }),
        v('mo_save', '储蓄版', '转一笔固定储蓄/指数定投，金额不限。', '转账截图', { minutes: 5 }),
        v('mo_review', '保单版', '检查 1 张保单/1 个订阅，取消不需要的。', '1 条记录', { minutes: 20 })
      ]
    },
    {
      id: 'relationship', domain: 'life', attr: 'rel',
      title: '关系维护', goal: '长期关系需要具体动作', tier: 1, minutes: 15,
      tags: ['relationship'],
      variants: [
        v('re_msg', '信息版', '给 1 位半年没联系的朋友发 1 条只关于对方的信息。', '发送截图', { minutes: 10 }),
        v('re_call', '通话版', '给 1 位重要的人打 10 分钟电话，只问不劝。', '1 条记录', { minutes: 15 }),
        v('re_min', '一句版', '给家人发 1 句具体的关心。', '发送截图', { minutes: 3 })
      ]
    },
    {
      id: 'family', domain: 'life', attr: 'rel', secondary: 'cal',
      title: '家人时间', goal: '在场，而不是应付', tier: 2, minutes: 45,
      tags: ['family'],
      variants: [
        v('fa_meal', '一餐版', '和家人吃一餐，手机放远，问 3 个问题。', '1 张照片或记录', { minutes: 45 }),
        v('fa_walk', '散步版', '陪家人走 20 分钟，不聊工作。', '1 条记录', { minutes: 20 }),
        v('fa_min', '一通电话', '打 5 分钟电话，只问对方近况。', '1 条记录', { minutes: 5 })
      ]
    },
    {
      id: 'social_exposure', domain: 'life', attr: 'rel', secondary: 'imp',
      title: '社交曝光', goal: '让机会知道你在', tier: 2, minutes: 40,
      tags: ['social'],
      variants: [
        v('se_event', '活动版', '参加 1 场行业/兴趣活动，主动认识 2 个人，各问 1 个问题。', '2 个新联系人', { minutes: 60 }),
        v('se_online', '线上版', '在 1 个专业社群做 1 次有价值的回应。', '1 条截图', { minutes: 15 }),
        v('se_min', '一条版', '给 1 位你想认识的人发 1 条有具体内容的私信。', '1 条发送记录', { minutes: 8 })
      ]
    },
    {
      id: 'environment', domain: 'life', attr: 'tas', secondary: 'wil',
      title: '环境整理', goal: '外部秩序降低内部噪音', tier: 1, minutes: 20,
      tags: ['environment'],
      variants: [
        v('en_desk', '桌面版', '桌面只留必要之物，拍前后对比。', '1 张对比照', { minutes: 15 }),
        v('en_room', '房间版', '处理 1 个「一直堆着」的角落。', '1 张照片', { minutes: 25 }),
        v('en_min', '5 分钟版', '只清 1 个抽屉/1 个包。', '1 条打卡', { minutes: 5 })
      ]
    },
    {
      id: 'digital_detox', domain: 'life', attr: 'wil', secondary: 'cal',
      title: '数字极简', goal: '把注意力从算法手里拿回来', tier: 2, minutes: 30,
      tags: ['focus'],
      variants: [
        v('dd_2h', '2 小时版', '连续 2 小时不打开任何社媒/短视频。', '屏幕使用时间截图', { minutes: 30 }),
        v('dd_clean', '清理版', '取关/静音 10 个不再服务于目标的账号。', '1 张截图', { minutes: 15 }),
        v('dd_min', '一餐版', '吃饭时不看手机。', '1 条打卡', { minutes: 20 })
      ]
    }
  ];

  /* ================= 微训练 60（12 属性 × 5） ================= */
  function micro(id, attr, minutes, action) { return { id: id, attr: attr, minutes: minutes, action: action }; }

  C.micro = [
    micro('mp1', 'pro', 5, '读 1 篇文献摘要，摘 1 个数字'),
    micro('mp2', 'pro', 3, '背 1 句产品核心信息'),
    micro('mp3', 'pro', 5, '查 1 条指南推荐等级'),
    micro('mp4', 'pro', 4, '写下客户最常问的 1 个问题'),
    micro('mp5', 'pro', 6, '用 3 句话复述 1 个临床终点'),

    micro('mi1', 'imp', 5, '给 1 位客户发 1 条有价值的信息'),
    micro('mi2', 'imp', 4, '练 1 次「一次拜访只问 3 个问题」'),
    micro('mi3', 'imp', 5, '写 1 句异议缓冲话术'),
    micro('mi4', 'imp', 3, '约 1 个人下周见 15 分钟'),
    micro('mi5', 'imp', 3, '向 1 位同事表达一次具体感谢'),

    micro('mr1', 'res', 5, '清掉 1 个拖了很久的待办'),
    micro('mr2', 'res', 5, '整理 1 次包/桌面'),
    micro('mr3', 'res', 4, '列 1 个可用资源清单（人/资料/预算）'),
    micro('mr4', 'res', 3, '退出 1 个无效群/取消 1 个订阅'),
    micro('mr5', 'res', 5, '把本周 3 件事排优先级'),

    micro('mv1', 'vit', 3, '靠墙站 3 分钟'),
    micro('mv2', 'vit', 4, '20 个深蹲 + 30 秒平板'),
    micro('mv3', 'vit', 5, '拉伸颈肩/髋 5 分钟'),
    micro('mv4', 'vit', 3, '今晚提前 15 分钟上床'),
    micro('mv5', 'vit', 2, '喝 500ml 水，不喝含糖饮料'),

    micro('mg1', 'img', 4, '护肤三步（清洁/保湿/防晒）'),
    micro('mg2', 'img', 3, '修指甲/鼻毛/剃须'),
    micro('mg3', 'img', 5, '熨 1 件衬衫/擦 1 双鞋'),
    micro('mg4', 'img', 3, '拍 1 张侧面站姿，检查颈前伸'),
    micro('mg5', 'img', 4, '检查口气与香水用量'),

    micro('mpr1', 'pre', 5, '录 30 秒自我介绍，回听语速'),
    micro('mpr2', 'pre', 4, '朗读 3 分钟，句末降调'),
    micro('mpr3', 'pre', 5, '对镜练 3 秒对视 + 2 秒停顿'),
    micro('mpr4', 'pre', 3, '用 1 句话讲清你最近在做的事'),
    micro('mpr5', 'pre', 4, '进门前停 2 秒，再开口'),

    micro('mt1', 'int', 5, '写 1 条决策日志（选了什么/放弃什么）'),
    micro('mt2', 'int', 5, '对 1 个判断找 1 个反例'),
    micro('mt3', 'int', 4, '连问 3 次「然后呢」'),
    micro('mt4', 'int', 5, '读 1 页书，写 1 句总结'),
    micro('mt5', 'int', 3, '把今天 1 件事压成 1 句话'),

    micro('mw1', 'wil', 5, '2 分钟启动法：先做 2 分钟'),
    micro('mw2', 'wil', 25, '关通知 25 分钟，只做 1 件事'),
    micro('mw3', 'wil', 5, '不想做也先做 5 分钟'),
    micro('mw4', 'wil', 4, '驳回 1 次小冲动（零食/刷手机）'),
    micro('mw5', 'wil', 3, '延迟 1 次购买 24 小时'),

    micro('mc1', 'cal', 4, '给当前情绪命名，只写 1 个词'),
    micro('mc2', 'cal', 3, '被冒犯时先等 6 秒再回应'),
    micro('mc3', 'cal', 5, '为 1 件坏事写 1 个替代解释'),
    micro('mc4', 'cal', 4, '4-7-8 呼吸 4 轮'),
    micro('mc5', 'cal', 5, '写下 1 条「事实」，删掉 1 条「评价」'),

    micro('mta1', 'tas', 5, '看 1 张好图，写 1 个手法'),
    micro('mta2', 'tas', 5, '分析 1 件物品的材质与比例'),
    micro('mta3', 'tas', 4, '整理 1 处视觉噪音（桌面/手机首页）'),
    micro('mta4', 'tas', 5, '挑 1 套明天要穿的衣服'),
    micro('mta5', 'tas', 4, '听 1 段音乐，只注意编曲'),

    micro('mrl1', 'rel', 3, '给家人发 1 条具体关心'),
    micro('mrl2', 'rel', 5, '约 1 位朋友吃饭/散步'),
    micro('mrl3', 'rel', 4, '问 1 个人「你最近在忙什么」并听完'),
    micro('mrl4', 'rel', 3, '记住 1 个人的一个细节'),
    micro('mrl5', 'rel', 2, '说 1 次具体的谢谢'),

    micro('mf1', 'fin', 4, '记 1 笔账，标 1 笔情绪消费'),
    micro('mf2', 'fin', 5, '查 1 张保单/1 个订阅'),
    micro('mf3', 'fin', 3, '转 1 笔储蓄（金额不限）'),
    micro('mf4', 'fin', 4, '取消 1 个不用的订阅'),
    micro('mf5', 'fin', 5, '看 1 个指数/1 只基金的费率')
  ];

  C.familyById = function (id) {
    for (var i = 0; i < C.taskFamilies.length; i++) if (C.taskFamilies[i].id === id) return C.taskFamilies[i];
    return null;
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
