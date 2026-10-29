/**
 * Toàn bộ dữ liệu kịch bản lịch sử 4 Màn (1930 – Nay),
 * tọa độ vật phẩm tương tác [E], điểm kích hoạt hành động QTE,
 * sự kiện trao mũ đầu Màn 3 và sự kiện Đài tưởng niệm Kết bài.
 */

export const WORLD_CONFIG = {
  totalWidth: 12000,
  actWidth: 3000,
  interactRadius: 120,
  startX: 160,
  minX: 70,
  maxX: 11850,
};

export const ACTS = [
  {
    id: 1,
    navLabel: 'Màn 1 (1930-1945)',
    period: '1930 – 1945',
    title: 'NGỌN LỬA GIỮA ĐÊM ĐEN',
    subtitle: 'Từ Hội nghị thành lập Đảng đến Cách mạng Tháng Tám & Tuyên ngôn Độc lập',
    roleLabel: 'Thanh niên yêu nước',
    startX: 0,
    endX: 3000,
    spawnX: 160,
    palette: {
      skyTop: '#07090f',
      skyMid: '#131926',
      skyBot: '#252d3d',
      mist: 'rgba(130, 148, 178, 0.14)',
      farHill: '#111622',
      midHill: '#0c1019',
      nearSil: '#07090e',
      ground: '#05070b',
      accent: '#dc2626',
      gold: '#f5c451',
    },
  },
  {
    id: 2,
    navLabel: 'Màn 2 (1945-1954)',
    period: '1945 – 1954',
    title: 'QUYẾT TỬ CHO TỔ QUỐC QUYẾT SINH',
    subtitle: 'Người Ông — Chiến sĩ Vệ quốc đoàn từ Hà Nội mùa đông 1946 đến Điện Biên Phủ 1954',
    roleLabel: 'Người Ông — Chiến sĩ Vệ quốc đoàn',
    startX: 3000,
    endX: 6000,
    spawnX: 3140,
    palette: {
      skyTop: '#160c0c',
      skyMid: '#381915',
      skyBot: '#6e2d1b',
      mist: 'rgba(235, 118, 60, 0.16)',
      farHill: '#241312',
      midHill: '#180d0d',
      nearSil: '#0d0708',
      ground: '#080506',
      accent: '#ef4444',
      gold: '#fbbf24',
    },
  },
  {
    id: 3,
    navLabel: 'Màn 3 (1954-1975)',
    period: '1954 – 1975',
    title: 'XẺ DỌC TRƯỜNG SƠN ĐI CỨU NƯỚC',
    subtitle: 'Người Cha — Chiến sĩ Giải phóng quân vượt Trường Sơn đến Đại thắng mùa Xuân 1975',
    roleLabel: 'Người Cha — Chiến sĩ Giải phóng quân',
    startX: 6000,
    endX: 9000,
    spawnX: 6050,
    palette: {
      skyTop: '#06131f',
      skyMid: '#0d293d',
      skyBot: '#18475c',
      mist: 'rgba(92, 214, 195, 0.14)',
      farHill: '#0a1f2c',
      midHill: '#071722',
      nearSil: '#040e15',
      ground: '#03090e',
      accent: '#34d399',
      gold: '#fcd34d',
    },
  },
  {
    id: 4,
    navLabel: 'Màn 4 (1975-Nay)',
    period: '1975 – Nay',
    title: 'HỒI ỨC & CƠ ĐỒ HÔM NAY',
    subtitle: 'Người Cháu — Thế hệ trẻ hôm nay giữa bình minh Đổi mới, Hội nhập và Tri ân',
    roleLabel: 'Người Cháu — Sinh viên Việt Nam hôm nay',
    startX: 9000,
    endX: 12000,
    spawnX: 9140,
    palette: {
      skyTop: '#1e4b7a',
      skyMid: '#5fa3c9',
      skyBot: '#fbd39b',
      mist: 'rgba(255, 236, 195, 0.24)',
      farHill: '#4a7399',
      midHill: '#2f5373',
      nearSil: '#1b3147',
      ground: '#122130',
      accent: '#f59e0b',
      gold: '#fde68a',
    },
  },
];

export const INTERACTABLES = [
  // ==================== MÀN 1 (0 - 3000) ====================
  {
    id: 'act1_item1',
    act: 1,
    x: 600,
    iconType: 'manifesto_table',
    tag: 'Mốc 3/2/1930',
    title: 'Bản Cương lĩnh trên bàn gỗ (Mốc 3/2/1930)',
    content:
      "Đầu năm 1930, tại Cửu Long (Hồng Kông), lãnh tụ Nguyễn Ái Quốc chủ trì Hội nghị hợp nhất các tổ chức cộng sản, thành lập Đảng Cộng sản Việt Nam (lấy ngày 3/2/1930 làm ngày kỷ niệm). Hội nghị thông qua Chánh cương vắn tắt và Sách lược vắn tắt — Cương lĩnh chính trị đầu tiên của Đảng, xác định nhiệm vụ chủ yếu trước mắt là: 'Đánh đổ đế quốc chủ nghĩa Pháp và bọn phong kiến, làm cho nước Nam được hoàn toàn độc lập', chấm dứt sự khủng hoảng về đường lối cứu nước.",
  },
  {
    id: 'act1_item2',
    act: 1,
    x: 1300,
    iconType: 'viet_minh_flag',
    tag: 'Mốc 5/1941',
    title: 'Chủ trương thành lập Mặt trận Việt Minh (Mốc 5/1941)',
    content:
      "Trước cảnh nhân dân chịu cảnh 'một cổ hai tròng' Pháp - Nhật, tháng 5/1941, Nguyễn Ái Quốc chủ trì Hội nghị Trung ương lần thứ tám tại Cao Bằng, đặt nhiệm vụ giải phóng dân tộc lên hàng đầu: 'Trong lúc này quyền lợi của bộ phận, của giai cấp phải đặt dưới sự sinh tử, tồn vong của quốc gia, của dân tộc'. Hội nghị quyết định thành lập Mặt trận Việt Minh (ngày 19/5/1941), tập hợp rộng rãi mọi người dân có lòng yêu nước thương nòi cùng đứng lên giành độc lập, tự do.",
  },
  {
    id: 'act1_item3',
    act: 1,
    x: 1900,
    iconType: 'ox_cart_granary',
    tag: 'Đầu năm 1945',
    title: 'Chiếc xe bò bên kho thóc Nhật (Đầu năm 1945)',
    content:
      "Trong bối cảnh nạn đói cuối năm 1944 – đầu năm 1945 làm 2 triệu người dân chết đói, đêm 9/3/1945, Nhật nổ súng đảo chính lật đổ Pháp độc chiếm Đông Dương. Ngay ngày 12/3/1945, Ban Thường vụ Trung ương Đảng ra Chỉ thị 'Nhật - Pháp bắn nhau và hành động của chúng ta', phát động cao trào kháng Nhật cứu nước làm tiền đề cho tổng khởi nghĩa, với khẩu hiệu 'Phá kho thóc, giải quyết nạn đói' thổi bùng ngọn lửa đấu tranh trong quần chúng.",
  },

  // ==================== MÀN 2 (3000 - 6000) ====================
  {
    id: 'act2_item1',
    act: 2,
    x: 3500,
    iconType: 'rice_jar_blackboard',
    tag: '1945 – 1946',
    title: 'Hũ gạo tiết kiệm & Bảng đen Bình dân học vụ (1945 – 1946)',
    content:
      "Sau ngày độc lập, chính quyền cách mạng non trẻ đứng trước tình thế 'ngàn cân treo sợi tóc': ngân khố kiệt quệ, kho bạc trống rỗng, 95% dân số thất học, mù chữ, thù trong giặc ngoài bủa vây. Ngày 25/11/1945, Trung ương Đảng ra Chỉ thị 'Kháng chiến kiến quốc' với khẩu hiệu 'Dân tộc trên hết, Tổ quốc trên hết', đồng thời phát động diệt giặc đói, diệt giặc dốt, diệt giặc ngoại xâm và tổ chức thắng lợi cuộc Tổng tuyển cử đầu tiên ngày 6/1/1946.",
  },
  {
    id: 'act2_item2',
    act: 2,
    x: 4200,
    iconType: 'barricade_speaker',
    tag: '19/12/1946',
    title: 'Chiếc loa truyền thanh trên chiến lũy Hà Nội (19/12/1946)',
    content:
      "Trước hành động bội ước và tối hậu thư của thực dân Pháp, ngày 19/12/1946, Chủ tịch Hồ Chí Minh ra Lời kêu gọi toàn quốc kháng chiến: 'Chúng ta muốn hòa bình, chúng ta phải nhân nhượng. Nhưng chúng ta càng nhân nhượng, thực dân Pháp càng lấn tới, vì chúng quyết tâm cướp nước ta lần nữa! Không! Chúng ta thà hy sinh tất cả, chứ nhất định không chịu mất nước, nhất định không chịu làm nô lệ'. Đường lối kháng chiến của Đảng được xác định: Toàn dân, toàn diện, lâu dài và dựa vào sức mình là chính.",
  },
  {
    id: 'act2_item3',
    act: 2,
    x: 4900,
    iconType: 'pack_bike_map',
    tag: '1953 – 1954',
    title: 'Chiếc xe đạp thồ & Sơ đồ tác chiến Điện Biên Phủ (1953 – 1954)',
    content:
      "Được Mỹ viện trợ, thực dân Pháp đề ra Kế hoạch Nava, biến Điện Biên Phủ thành tập đoàn cứ điểm mạnh nhất Đông Dương — một 'pháo đài khổng lồ không thể công phá'. Tháng 12/1953, Bộ Chính trị quyết định mở Chiến dịch Điện Biên Phủ. Quán triệt phương châm 'đánh chắc, tiến chắc', 'đánh chắc thắng', toàn Đảng, toàn quân, toàn dân đã huy động hàng vạn ngày công, hàng vạn tấn lương thực, vũ khí ra tiền tuyến.",
  },

  // ==================== MÀN 3 (6000 - 9000) ====================
  {
    id: 'act3_item1',
    act: 3,
    x: 6600,
    iconType: 'campfire_letter',
    tag: 'Mốc Đại hội III – 9/1960',
    title: 'Bức thư nhà bên bếp lửa Trường Sơn (Mốc Đại hội III – 9/1960)',
    content:
      "Sau Hiệp định Giơnevơ (7/1954), đất nước tạm thời bị chia cắt ở vĩ tuyến 17; đế quốc Mỹ thay chân Pháp dựng lên chính quyền tay sai Ngô Đình Diệm, áp đặt chủ nghĩa thực dân mới ở miền Nam nhằm chia cắt lâu dài nước ta. Tháng 9/1960, Đại hội đại biểu toàn quốc lần thứ III của Đảng đề ra đường lối tiến hành đồng thời hai chiến lược cách mạng: cách mạng xã hội chủ nghĩa ở miền Bắc và cách mạng dân tộc dân chủ nhân dân ở miền Nam; xây dựng miền Bắc thành hậu phương lớn chi viện cho tiền tuyến lớn miền Nam để thống nhất Tổ quốc.",
  },
  {
    id: 'act3_item2',
    act: 3,
    x: 7400,
    iconType: 'radio_milestone',
    tag: '1965 – 1973',
    title: 'Chiếc radio bán dẫn & Cột mốc Trường Sơn (1965 – 1973)',
    content:
      "Đương đầu với các chiến lược chiến tranh xâm lược tàn bạo của đế quốc Mỹ cùng các trang bị vũ khí, công nghệ hiện đại bậc nhất, dưới sự lãnh đạo kiên trì và đúng đắn của Đảng, quân và dân hai miền Nam – Bắc giữ vững chân lý 'Không có gì quý hơn độc lập, tự do', vượt qua mọi thách thức hiểm nghèo, từng bước đánh bại các kế hoạch chiến tranh của địch, tạo thế và lực tiến tới ngày toàn thắng.",
  },

  // ==================== MÀN 4 (9000 - 12000) ====================
  {
    id: 'act4_item1',
    act: 4,
    x: 9700,
    iconType: 'history_board',
    tag: '1976 & Đại hội VI – 12/1986',
    title: 'Bảng tin Lịch sử: Thống nhất Nhà nước & Đường lối Đổi mới (12/1986)',
    content:
      "Sau đại thắng mùa Xuân năm 1975, đất nước hoàn thành thống nhất về mặt Nhà nước (qua cuộc Tổng tuyển cử ngày 25/4/1976 và kỳ họp Quốc hội ngày 2/7/1976 quyết định tên nước là Cộng hòa xã hội chủ nghĩa Việt Nam), đưa cả nước quá độ lên chủ nghĩa xã hội trong bối cảnh hậu quả chiến tranh nặng nề và khủng hoảng kinh tế - xã hội. Qua quá trình khảo nghiệm thực tiễn và đổi mới tư duy lý luận (1975 – 1986), tại Đại hội VI (tháng 12/1986), Đảng đã hoạch định Đường lối Đổi mới toàn diện đất nước, mở ra bước ngoặt phát triển mới.",
  },
  {
    id: 'act4_item2',
    act: 4,
    x: 10500,
    iconType: 'modern_emblem',
    tag: '1986 – Nay',
    title: 'Biểu tượng Công nghiệp hóa, Hiện đại hóa & Hội nhập (1986 – Nay)',
    content:
      "Từ một quốc gia nông nghiệp lạc hậu, một nước thuộc địa nửa phong kiến, dưới sự lãnh đạo của Đảng thực hiện công cuộc Đổi mới, đẩy mạnh công nghiệp hóa, hiện đại hóa và hội nhập quốc tế, đất nước ta đã đạt được những thành tựu to lớn, có ý nghĩa lịch sử — 'có được cơ đồ và vị thế như ngày nay'.",
  },
];

export const QTE_ZONES = [
  // ==================== MÀN 1 ====================
  {
    id: 'qte_1a',
    act: 1,
    x: 2300,
    triggerRadius: 95,
    title: 'Phá kho thóc Nhật (Đầu năm 1945)',
    steps: [
      {
        mode: 'timing',
        key: 'SPACE',
        keyLabel: 'SPACE',
        prompt: 'Đèn pha tuần tra quét tới! Bấm [SPACE] đúng nhịp để lách qua bóng tối!',
        duration: 2.9, // real seconds in slow-mo
        sweetSpotStart: 0.42, // ring progress [0..1]
        sweetSpotEnd: 0.92,
        actionPose: 'dash',
      },
      {
        mode: 'mash',
        key: 'KeyF',
        keyLabel: 'F',
        targetCount: 3,
        prompt: 'Nhấp [F] 3 lần để vung búa phá tung cổng kho thóc Nhật!',
        duration: 4.5,
        actionPose: 'hammer',
      },
    ],
    rewardEffect: 'grain_burst',
    banner: null,
  },
  {
    id: 'qte_1b',
    act: 1,
    x: 2750,
    triggerRadius: 95,
    title: 'Tổng khởi nghĩa Tháng Tám (19/8/1945) & Tuyên ngôn Độc lập (2/9/1945)',
    steps: [
      {
        mode: 'timing',
        key: 'KeyF',
        keyLabel: 'F',
        prompt: 'Bấm [F] đúng nhịp vòng sáng để phất cao Cờ Đỏ Sao Vàng độc lập!',
        duration: 3.1,
        sweetSpotStart: 0.4,
        sweetSpotEnd: 0.93,
        actionPose: 'flag_raise',
      },
    ],
    rewardEffect: 'independence_dawn',
    banner: {
      badge: 'QUẢNG TRƯỜNG BA ĐÌNH — 2/9/1945',
      title: 'Tuyên ngôn Độc lập khai sinh nước Việt Nam Dân chủ Cộng hòa',
      quote:
        '“Nước Việt Nam có quyền hưởng tự do và độc lập, và sự thực đã thành một nước tự do và độc lập.”',
      note: 'Thắng lợi của Cách mạng Tháng Tám năm 1945 đã đập tan xiềng xích thực dân - phong kiến, mở ra kỷ nguyên Độc lập - Tự do cho dân tộc Việt Nam.',
    },
  },

  // ==================== MÀN 2 ====================
  {
    id: 'qte_2a',
    act: 2,
    x: 5350,
    triggerRadius: 95,
    title: 'Vượt lưới lửa Điện Biên',
    steps: [
      {
        mode: 'timing',
        key: 'SPACE',
        keyLabel: 'SPACE',
        prompt: 'Máy bay địch thả bom! Bấm [SPACE] phóng qua giao thông hào né tâm nổ!',
        duration: 2.9,
        sweetSpotStart: 0.4,
        sweetSpotEnd: 0.92,
        actionPose: 'leap_trench',
      },
    ],
    rewardEffect: 'trench_blast',
    banner: null,
  },
  {
    id: 'qte_2b',
    act: 2,
    x: 5750,
    triggerRadius: 95,
    title: 'Toàn thắng Điện Biên Phủ (7/5/1954)',
    steps: [
      {
        mode: 'timing',
        key: 'KeyF',
        keyLabel: 'F',
        prompt: '17 giờ 30 chiều 7/5/1954 — Bấm [F] đánh bộc phá & phất cờ trên nóc hầm Đờ Cátơri!',
        duration: 3.1,
        sweetSpotStart: 0.4,
        sweetSpotEnd: 0.93,
        actionPose: 'bunker_flag',
      },
    ],
    rewardEffect: 'dien_bien_victory',
    banner: {
      badge: '17 GIỜ 30 PHÚT — NGÀY 7/5/1954',
      title: 'Toàn thắng Điện Biên Phủ — Lừng lẫy năm châu, chấn động địa cầu',
      quote:
        "Chiến thắng Điện Biên Phủ 'chấn động địa cầu' đã buộc thực dân Pháp phải ký Hiệp định Giơnevơ (21/7/1954) — văn bản pháp lý quốc tế đầu tiên công nhận các quyền dân tộc cơ bản của Việt Nam là độc lập, chủ quyền, thống nhất và toàn vẹn lãnh thổ, giải phóng hoàn toàn miền Bắc.",
      note: null,
    },
  },

  // ==================== MÀN 3 ====================
  {
    id: 'qte_3a',
    act: 3,
    x: 8100,
    triggerRadius: 95,
    title: 'Băng qua mưa bom tọa độ Trường Sơn',
    steps: [
      {
        mode: 'timing',
        key: 'SPACE',
        keyLabel: 'SPACE',
        prompt: 'Nhịp 1/2: Bấm [SPACE] nhảy vượt qua hố bom đang rực cháy!',
        duration: 2.8,
        sweetSpotStart: 0.4,
        sweetSpotEnd: 0.92,
        actionPose: 'leap_crater',
      },
      {
        mode: 'timing',
        key: 'KeyF',
        keyLabel: 'F',
        prompt: 'Nhịp 2/2: Bấm [F] che chắn cùng đồng đội vượt qua sóng xung kích!',
        duration: 2.8,
        sweetSpotStart: 0.38,
        sweetSpotEnd: 0.93,
        actionPose: 'shield_comrade',
      },
    ],
    rewardEffect: 'shockwave_guard',
    banner: null,
  },
  {
    id: 'qte_3b',
    act: 3,
    x: 8650,
    triggerRadius: 105,
    title: 'Chiến dịch Hồ Chí Minh lịch sử (30/4/1975)',
    steps: [
      {
        mode: 'mash',
        key: 'KeyF',
        keyLabel: 'F',
        targetCount: 5,
        prompt: 'Nhấp liên hoàn [F] cùng Xe tăng 390 húc đổ cổng Dinh Độc Lập & cắm cờ toàn thắng!',
        duration: 5.2,
        actionPose: 'tank_charge',
      },
    ],
    rewardEffect: 'reunification_victory',
    banner: {
      badge: '11 GIỜ 30 PHÚT — NGÀY 30/4/1975',
      title: 'Chiến dịch Hồ Chí Minh toàn thắng — Non sông thu về một mối',
      quote:
        'Xe tăng Quân Giải phóng húc đổ cánh cổng Dinh Độc Lập, lá cờ chiến thắng tung bay lúc 11 giờ 30 phút ngày 30/4/1975 — giải phóng hoàn toàn miền Nam, thống nhất Tổ quốc!',
      note: 'Khói lửa chiến tranh lùi lại phía sau, mở ra kỷ nguyên cả nước độc lập, thống nhất, đi lên chủ nghĩa xã hội.',
    },
  },
];

export const HANDOFF_EVENT = {
  x: 6100,
  triggerMinX: 6035,
  triggerMaxX: 6260,
  captionTitle: 'TIẾP LỬA HAI THẾ HỆ (1954)',
  captionText:
    'Người Ông (Vệ quốc đoàn) trao lại chiếc mũ chiến sĩ và lời thề độc lập cho Người Cha lên đường xẻ dọc Trường Sơn cứu nước.',
};

export const FINALE_EVENT = {
  x: 11400,
  triggerRadius: 145,
  holdDuration: 2.5, // Giữ phím [F] trong 2.5 giây
  spiritViewingDelay: 3.0, // Sau 3 giây hiển thị Ending Finale Overlay
  promptText: 'Giữ phím [F] trong 2.5 giây để thắp nén tâm hương tri ân',
  failSafeMessage: 'Giữ vững ý chí cách mạng! Hãy thử lại!',
  quoteText:
    '“Bản Tuyên ngôn độc lập là hoa là quả của bao nhiêu máu đã đổ và bao nhiêu tính mạng đã hy sinh của những người con anh dũng của Việt Nam trong nhà tù, trong trại tập trung, trong những hải đảo xa xôi, trên máy chém, trên chiến trường. Bản Tuyên ngôn độc lập là kết quả của bao nhiêu hy vọng, gắng sức và tin tưởng của hơn hai mươi triệu nhân dân Việt Nam.”',
  quoteAuthor: '(Trần Dân Tiên, Những mẩu chuyện về đời hoạt động của Hồ Chủ tịch)',
  lessonTitle: 'Bài học lịch sử & Sứ mệnh hôm nay',
  lessonText:
    'Sự lãnh đạo đúng đắn của Đảng Cộng sản Việt Nam, truyền thống gắn bó mật thiết với nhân dân, đặt lợi ích dân tộc lên trên hết và sức mạnh đại đoàn kết toàn dân tộc là nhân tố hàng đầu quyết định mọi thắng lợi của cách mạng Việt Nam. Hòa bình hôm nay được đánh đổi bằng xương máu của các thế hệ cha ông; giữ vững niềm tin vào Đảng, xây dựng và bảo vệ vững chắc Tổ quốc xã hội chủ nghĩa là sứ mệnh của thế hệ trẻ hôm nay.',
  replayButtonLabel: 'Trải nghiệm lại từ đầu',
};

