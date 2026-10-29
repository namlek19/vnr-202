/**
 * Toàn bộ dữ liệu kịch bản lịch sử 4 Màn (1930 – Nay),
 * phân khu địa điểm (zones), địa hình đa tầng (groundProfile, platforms, obstacles),
 * vật phẩm tương tác [E], điểm kích hoạt QTE và sự kiện chuyển giao thế hệ.
 *
 * Mỗi Màn là một không gian độc lập có tọa độ localX từ 0 đến 3000.
 */

export const WORLD_CONFIG = {
  actWidth: 3000,
  interactRadiusX: 110,
  interactRadiusY: 92,
  enterTargetX: 180,
  enterStartX: -40,
  exitTriggerX: 2820,
  exitOffscreenX: 3055,
  backTriggerX: 80,
  backOffscreenX: -45,
  backReturnStartX: 3040,
  backReturnTargetX: 2750,
  successorWaitX: 2860,
};

export const ACTS = [
  {
    id: 1,
    navLabel: 'Màn 1 (1930 – 1945)',
    shortLabel: 'Màn 1',
    period: '1930 – 1945',
    title: 'NGỌN LỬA GIỮA ĐÊM ĐEN',
    subtitle: 'Từ Hội nghị thành lập Đảng đến Cách mạng Tháng Tám & Tuyên ngôn Độc lập',
    roleLabel: 'Thanh niên yêu nước',
    palette: {
      skyTop: '#07090e',
      skyMid: '#121824',
      skyBot: '#232c3b',
      mist: 'rgba(148, 163, 184, 0.12)',
      farHill: '#101520',
      midHill: '#0b0f17',
      nearSil: '#07090e',
      ground: '#05060a',
      groundTop: '#161d29',
      accent: '#dc2626',
      gold: '#eab308',
    },
    zones: [
      { minX: 0, maxX: 880, name: 'Xóm lao động nghèo' },
      { minX: 880, maxX: 1680, name: 'Rừng núi biên giới Cao Bằng' },
      { minX: 1680, maxX: 2480, name: 'Khu kho thóc Nhật' },
      { minX: 2480, maxX: 3100, name: 'Quảng trường Ba Đình' },
    ],
    // dy > 0: trũng xuống; dy < 0: cao lên so với mặt đất chuẩn
    groundProfile: [
      [0, 0],
      [280, 6],
      [560, -4],
      [820, 8],
      [980, -18],
      [1140, 18],
      [1420, 18],
      [1620, -10],
      [1760, 0],
      [2520, 0],
      [2620, -18],
      [2880, -18],
      [3000, -18],
    ],
    platforms: [
      // Các bậc đá cao thấp trên vách núi rừng biên giới Cao Bằng
      { id: 'p1_rock1', x1: 960, x2: 1115, dy: -56, style: 'stone_ledge' },
      { id: 'p1_rock2', x1: 1095, x2: 1245, dy: -106, style: 'stone_ledge' },
      { id: 'p1_rock3', x1: 1220, x2: 1445, dy: -148, style: 'stone_ledge' },
      { id: 'p1_rock4', x1: 1425, x2: 1575, dy: -78, style: 'stone_ledge' },
      // Thùng gỗ & mái hiên thấp quanh Kho thóc Nhật
      { id: 'p1_crates', x1: 1985, x2: 2105, dy: -52, style: 'wood_crate' },
      { id: 'p1_awning', x1: 2085, x2: 2235, dy: -98, style: 'roof_eave' },
    ],
    obstacles: [],
    handoffAtEnd: null,
  },
  {
    id: 2,
    navLabel: 'Màn 2 (1945 – 1954)',
    shortLabel: 'Màn 2',
    period: '1945 – 1954',
    title: 'QUYẾT TỬ CHO TỔ QUỐC QUYẾT SINH',
    subtitle: 'Người Ông — Chiến sĩ Vệ quốc đoàn từ Hà Nội mùa đông 1946 đến Điện Biên Phủ 1954',
    roleLabel: 'Người Ông — Chiến sĩ Vệ quốc đoàn',
    palette: {
      skyTop: '#140b0b',
      skyMid: '#311714',
      skyBot: '#5c281b',
      mist: 'rgba(217, 119, 69, 0.13)',
      farHill: '#211110',
      midHill: '#160c0c',
      nearSil: '#0c0707',
      ground: '#070405',
      groundTop: '#241514',
      accent: '#ef4444',
      gold: '#f59e0b',
    },
    zones: [
      { minX: 0, maxX: 780, name: 'Lớp học Bình dân học vụ' },
      { minX: 780, maxX: 1540, name: 'Chiến lũy phố cổ Hà Nội' },
      { minX: 1540, maxX: 2160, name: 'Đèo dốc Tây Bắc' },
      { minX: 2160, maxX: 3100, name: 'Lòng chảo Điện Biên Phủ' },
    ],
    groundProfile: [
      [0, 0],
      [780, 0],
      [1520, 0],
      // Đồi dốc Tây Bắc
      [1720, -46],
      [1880, -76],
      [2040, -34],
      [2160, 0],
      // Giao thông hào Điện Biên Phủ trũng sâu dưới mặt đất
      [2220, 48],
      [2540, 48],
      [2600, 0],
      [3000, 0],
    ],
    platforms: [
      // Chiến lũy bàn ghế gỗ, bao cát & toa tàu điện cũ Hà Nội
      { id: 'p2_barricade_low', x1: 920, x2: 1090, dy: -54, style: 'barricade' },
      { id: 'p2_tram_top', x1: 1065, x2: 1320, dy: -104, style: 'tram_roof' },
      { id: 'p2_balcony', x1: 1295, x2: 1435, dy: -56, style: 'roof_eave' },
      // Ụ pháo cao & cầu ván bắc qua giao thông hào Điện Biên
      { id: 'p2_trench_plank1', x1: 2230, x2: 2345, dy: -16, style: 'trench_plank' },
      { id: 'p2_trench_plank2', x1: 2430, x2: 2555, dy: -20, style: 'trench_plank' },
      // Nắp hầm tướng Đờ Cátơri
      { id: 'p2_bunker_roof', x1: 2615, x2: 2765, dy: -56, style: 'bunker_roof' },
    ],
    // Chiến lũy chặn ngang buộc bấm W nhảy lên vượt qua (cao 54px, dễ dàng nhảy qua)
    obstacles: [
      { id: 'obs_hanoi_barricade', x1: 935, x2: 1015, dy: -54, hint: '[W] Nhảy qua chiến lũy' },
    ],
    handoffAtEnd: {
      successorAct: 3,
      caption:
        '1954: Người Ông trao lại chiếc mũ chiến sĩ và ý chí độc lập cho Người Cha lên đường xẻ dọc Trường Sơn.',
    },
  },
  {
    id: 3,
    navLabel: 'Màn 3 (1954 – 1975)',
    shortLabel: 'Màn 3',
    period: '1954 – 1975',
    title: 'XẺ DỌC TRƯỜNG SƠN ĐI CỨU NƯỚC',
    subtitle: 'Người Cha — Chiến sĩ Giải phóng quân vượt Trường Sơn đến Đại thắng mùa Xuân 1975',
    roleLabel: 'Người Cha — Chiến sĩ Giải phóng quân',
    palette: {
      skyTop: '#06121c',
      skyMid: '#0c2638',
      skyBot: '#164052',
      mist: 'rgba(94, 234, 212, 0.1)',
      farHill: '#091c28',
      midHill: '#07141e',
      nearSil: '#040c12',
      ground: '#03080c',
      groundTop: '#102a38',
      accent: '#34d399',
      gold: '#fbbf24',
    },
    zones: [
      { minX: 0, maxX: 980, name: 'Đường mòn Trường Sơn' },
      { minX: 980, maxX: 1760, name: 'Cầu treo & Trạm giao liên rừng già' },
      { minX: 1760, maxX: 2360, name: 'Tọa độ lửa Trường Sơn' },
      { minX: 2360, maxX: 3100, name: 'Đường tiến về Dinh Độc Lập' },
    ],
    groundProfile: [
      [0, 0],
      [340, -28],
      [620, -18],
      [820, 0],
      [1050, 0],
      // Vực suối nông dưới cầu treo gỗ
      [1110, 52],
      [1340, 52],
      [1400, -18],
      [1560, -34],
      [1760, 0],
      // Hố bom trũng sâu tọa độ lửa
      [1940, 50],
      [2150, 50],
      [2230, 0],
      // Đường phố Sài Gòn & Bậc thềm Dinh Độc Lập
      [2520, 0],
      [2640, -18],
      [3000, -18],
    ],
    platforms: [
      // Thân cây cổ thụ đổ ngang đường rừng Trường Sơn
      { id: 'p3_fallen_log', x1: 840, x2: 1030, dy: -50, style: 'fallen_log' },
      // Cầu treo gỗ bắc qua vực suối
      { id: 'p3_bridge', x1: 1055, x2: 1385, dy: -32, style: 'wood_bridge' },
      // Bậc đá dưới suối để nhảy lên bờ dễ dàng nếu tụt S xuống suối
      { id: 'p3_stream_step', x1: 1280, x2: 1390, dy: 10, style: 'stone_ledge' },
      // Bờ gỗ che chắn trên miệng hố bom
      { id: 'p3_crater_plank', x1: 1850, x2: 1965, dy: -18, style: 'trench_plank' },
    ],
    obstacles: [
      { id: 'obs_fallen_tree', x1: 855, x2: 920, dy: -50, hint: '[W] Vượt thân cây đổ' },
    ],
    handoffAtEnd: {
      successorAct: 4,
      caption:
        'Khói lửa chiến tranh hóa thành hạt sáng bình minh — Người Cha trao lại bầu trời hòa bình cho thế hệ trẻ hôm nay.',
    },
  },
  {
    id: 4,
    navLabel: 'Màn 4 (1975 – Nay)',
    shortLabel: 'Màn 4',
    period: '1975 – Nay',
    title: 'HỒI ỨC & CƠ ĐỒ HÔM NAY',
    subtitle: 'Người Cháu — Thế hệ trẻ hôm nay giữa bình minh Đổi mới, Hội nhập và Tri ân',
    roleLabel: 'Người Cháu — Sinh viên Việt Nam hôm nay',
    palette: {
      skyTop: '#1d4670',
      skyMid: '#5697bd',
      skyBot: '#f5cb92',
      mist: 'rgba(255, 243, 214, 0.2)',
      farHill: '#446c91',
      midHill: '#2b4c6b',
      nearSil: '#192e42',
      ground: '#101d2b',
      groundTop: '#294661',
      accent: '#f59e0b',
      gold: '#fde68a',
    },
    zones: [
      { minX: 0, maxX: 980, name: 'Đại lộ Bình minh — Cổng trường Đại học' },
      { minX: 980, maxX: 2080, name: 'Cầu vượt đô thị & Không gian Đổi mới' },
      { minX: 2080, maxX: 3100, name: 'Đài tưởng niệm Tổ quốc ghi công' },
    ],
    groundProfile: [
      [0, 0],
      [2200, 0],
      // Bậc thềm trang nghiêm dẫn lên Đài tưởng niệm Tổ quốc ghi công
      [2280, -14],
      [2360, -28],
      [2440, -42],
      [3000, -42],
    ],
    platforms: [
      // Cầu vượt đi bộ đa tầng hiện đại (bấm W lên ngắm thành phố, bấm S xuống mặt đường)
      { id: 'p4_overpass_left', x1: 1010, x2: 1175, dy: -56, style: 'modern_walkway' },
      { id: 'p4_overpass_top', x1: 1145, x2: 1685, dy: -112, style: 'modern_walkway' },
      { id: 'p4_overpass_right', x1: 1655, x2: 1815, dy: -56, style: 'modern_walkway' },
    ],
    obstacles: [],
    handoffAtEnd: null,
  },
];

/**
 * Nội suy độ lệch mặt đất dy(localX) mượt mà theo từng Màn
 */
export function sampleGroundOffset(actId, localX) {
  const act = ACTS.find((a) => a.id === actId) || ACTS[0];
  const pts = act.groundProfile;
  if (!pts || pts.length === 0) return 0;
  if (localX <= pts[0][0]) return pts[0][1];
  if (localX >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];

  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    if (localX >= x0 && localX <= x1) {
      const t = (localX - x0) / Math.max(1, x1 - x0);
      const smoothT = (1 - Math.cos(t * Math.PI)) * 0.5;
      return y0 + (y1 - y0) * smoothT;
    }
  }
  return 0;
}

/**
 * Lấy tên phân khu địa điểm cụ thể theo tọa độ nhân vật
 */
export function getZoneName(actId, localX) {
  const act = ACTS.find((a) => a.id === actId) || ACTS[0];
  const clamped = Math.max(0, Math.min(WORLD_CONFIG.actWidth, localX));
  const zone = act.zones.find((z) => clamped >= z.minX && clamped <= z.maxX);
  return zone ? zone.name : act.zones[0].name;
}

// ==================== NỘI DUNG VĂN BẢN LỊCH SỬ (GIỮ NGUYÊN VĂN 100%) ====================

export const INTERACTABLES = [
  // ==================== MÀN 1 (localX: 0 - 3000) ====================
  {
    id: 'act1_item1',
    act: 1,
    x: 560,
    platformId: null,
    iconType: 'manifesto_table',
    tag: 'Mốc 3/2/1930',
    title: 'Bản Cương lĩnh trên bàn gỗ (Mốc 3/2/1930)',
    content:
      "Đầu năm 1930, tại Cửu Long (Hồng Kông), lãnh tụ Nguyễn Ái Quốc chủ trì Hội nghị hợp nhất các tổ chức cộng sản, thành lập Đảng Cộng sản Việt Nam (lấy ngày 3/2/1930 làm ngày kỷ niệm). Hội nghị thông qua Chánh cương vắn tắt và Sách lược vắn tắt — Cương lĩnh chính trị đầu tiên của Đảng, xác định nhiệm vụ chủ yếu trước mắt là: 'Đánh đổ đế quốc chủ nghĩa Pháp và bọn phong kiến, làm cho nước Nam được hoàn toàn độc lập', chấm dứt sự khủng hoảng về đường lối cứu nước.",
  },
  {
    id: 'act1_item2',
    act: 1,
    x: 1330,
    platformId: 'p1_rock3', // Trên mỏm đá cao vách núi Cao Bằng (nhảy W lên đọc)
    iconType: 'viet_minh_flag',
    tag: 'Mốc 5/1941',
    title: 'Chủ trương thành lập Mặt trận Việt Minh (Mốc 5/1941)',
    content:
      "Trước cảnh nhân dân chịu cảnh 'một cổ hai tròng' Pháp - Nhật, tháng 5/1941, Nguyễn Ái Quốc chủ trì Hội nghị Trung ương lần thứ tám tại Cao Bằng, đặt nhiệm vụ giải phóng dân tộc lên hàng đầu: 'Trong lúc này quyền lợi của bộ phận, của giai cấp phải đặt dưới sự sinh tử, tồn vong của quốc gia, của dân tộc'. Hội nghị quyết định thành lập Mặt trận Việt Minh (ngày 19/5/1941), tập hợp rộng rãi mọi người dân có lòng yêu nước thương nòi cùng đứng lên giành độc lập, tự do.",
  },
  {
    id: 'act1_item3',
    act: 1,
    x: 1880,
    platformId: null,
    iconType: 'ox_cart_granary',
    tag: 'Đầu năm 1945',
    title: 'Chiếc xe bò bên kho thóc Nhật (Đầu năm 1945)',
    content:
      "Trong bối cảnh nạn đói cuối năm 1944 – đầu năm 1945 làm 2 triệu người dân chết đói, đêm 9/3/1945, Nhật nổ súng đảo chính lật đổ Pháp độc chiếm Đông Dương. Ngay ngày 12/3/1945, Ban Thường vụ Trung ương Đảng ra Chỉ thị 'Nhật - Pháp bắn nhau và hành động của chúng ta', phát động cao trào kháng Nhật cứu nước làm tiền đề cho tổng khởi nghĩa, với khẩu hiệu 'Phá kho thóc, giải quyết nạn đói' thổi bùng ngọn lửa đấu tranh trong quần chúng.",
  },

  // ==================== MÀN 2 (localX: 0 - 3000) ====================
  {
    id: 'act2_item1',
    act: 2,
    x: 500,
    platformId: null,
    iconType: 'rice_jar_blackboard',
    tag: '1945 – 1946',
    title: 'Hũ gạo tiết kiệm & Bảng đen Bình dân học vụ (1945 – 1946)',
    content:
      "Sau ngày độc lập, chính quyền cách mạng non trẻ đứng trước tình thế 'ngàn cân treo sợi tóc': ngân khố kiệt quệ, kho bạc trống rỗng, 95% dân số thất học, mù chữ, thù trong giặc ngoài bủa vây. Ngày 25/11/1945, Trung ương Đảng ra Chỉ thị 'Kháng chiến kiến quốc' với khẩu hiệu 'Dân tộc trên hết, Tổ quốc trên hết', đồng thời phát động diệt giặc đói, diệt giặc dốt, diệt giặc ngoại xâm và tổ chức thắng lợi cuộc Tổng tuyển cử đầu tiên ngày 6/1/1946.",
  },
  {
    id: 'act2_item2',
    act: 2,
    x: 1190,
    platformId: 'p2_tram_top', // Đặt trên đỉnh chiến lũy / toa tàu điện Hà Nội
    iconType: 'barricade_speaker',
    tag: '19/12/1946',
    title: 'Chiếc loa truyền thanh trên chiến lũy Hà Nội (19/12/1946)',
    content:
      "Trước hành động bội ước và tối hậu thư của thực dân Pháp, ngày 19/12/1946, Chủ tịch Hồ Chí Minh ra Lời kêu gọi toàn quốc kháng chiến: 'Chúng ta muốn hòa bình, chúng ta phải nhân nhượng. Nhưng chúng ta càng nhân nhượng, thực dân Pháp càng lấn tới, vì chúng quyết tâm cướp nước ta lần nữa! Không! Chúng ta thà hy sinh tất cả, chứ nhất định không chịu mất nước, nhất định không chịu làm nô lệ'. Đường lối kháng chiến của Đảng được xác định: Toàn dân, toàn diện, lâu dài và dựa vào sức mình là chính.",
  },
  {
    id: 'act2_item3',
    act: 2,
    x: 1880,
    platformId: null, // Trên đỉnh đèo Tây Bắc
    iconType: 'pack_bike_map',
    tag: '1953 – 1954',
    title: 'Chiếc xe đạp thồ & Sơ đồ tác chiến Điện Biên Phủ (1953 – 1954)',
    content:
      "Được Mỹ viện trợ, thực dân Pháp đề ra Kế hoạch Nava, biến Điện Biên Phủ thành tập đoàn cứ điểm mạnh nhất Đông Dương — một 'pháo đài khổng lồ không thể công phá'. Tháng 12/1953, Bộ Chính trị quyết định mở Chiến dịch Điện Biên Phủ. Quán triệt phương châm 'đánh chắc, tiến chắc', 'đánh chắc thắng', toàn Đảng, toàn quân, toàn dân đã huy động hàng vạn ngày công, hàng vạn tấn lương thực, vũ khí ra tiền tuyến.",
  },

  // ==================== MÀN 3 (localX: 0 - 3000) ====================
  {
    id: 'act3_item1',
    act: 3,
    x: 580,
    platformId: null,
    iconType: 'campfire_letter',
    tag: 'Mốc Đại hội III – 9/1960',
    title: 'Bức thư nhà bên bếp lửa Trường Sơn (Mốc Đại hội III – 9/1960)',
    content:
      "Sau Hiệp định Giơnevơ (7/1954), đất nước tạm thời bị chia cắt ở vĩ tuyến 17; đế quốc Mỹ thay chân Pháp dựng lên chính quyền tay sai Ngô Đình Diệm, áp đặt chủ nghĩa thực dân mới ở miền Nam nhằm chia cắt lâu dài nước ta. Tháng 9/1960, Đại hội đại biểu toàn quốc lần thứ III của Đảng đề ra đường lối tiến hành đồng thời hai chiến lược cách mạng: cách mạng xã hội chủ nghĩa ở miền Bắc và cách mạng dân tộc dân chủ nhân dân ở miền Nam; xây dựng miền Bắc thành hậu phương lớn chi viện cho tiền tuyến lớn miền Nam để thống nhất Tổ quốc.",
  },
  {
    id: 'act3_item2',
    act: 3,
    x: 1520,
    platformId: null,
    iconType: 'radio_milestone',
    tag: '1965 – 1973',
    title: 'Chiếc radio bán dẫn & Cột mốc Trường Sơn (1965 – 1973)',
    content:
      "Đương đầu với các chiến lược chiến tranh xâm lược tàn bạo của đế quốc Mỹ cùng các trang bị vũ khí, công nghệ hiện đại bậc nhất, dưới sự lãnh đạo kiên trì và đúng đắn của Đảng, quân và dân hai miền Nam – Bắc giữ vững chân lý 'Không có gì quý hơn độc lập, tự do', vượt qua mọi thách thức hiểm nghèo, từng bước đánh bại các kế hoạch chiến tranh của địch, tạo thế và lực tiến tới ngày toàn thắng.",
  },

  // ==================== MÀN 4 (localX: 0 - 3000) ====================
  {
    id: 'act4_item1',
    act: 4,
    x: 700,
    platformId: null,
    iconType: 'history_board',
    tag: '1976 & Đại hội VI – 12/1986',
    title: 'Bảng tin Lịch sử: Thống nhất Nhà nước & Đường lối Đổi mới (12/1986)',
    content:
      "Sau đại thắng mùa Xuân năm 1975, đất nước hoàn thành thống nhất về mặt Nhà nước (qua cuộc Tổng tuyển cử ngày 25/4/1976 và kỳ họp Quốc hội ngày 2/7/1976 quyết định tên nước là Cộng hòa xã hội chủ nghĩa Việt Nam), đưa cả nước quá độ lên chủ nghĩa xã hội trong bối cảnh hậu quả chiến tranh nặng nề và khủng hoảng kinh tế - xã hội. Qua quá trình khảo nghiệm thực tiễn và đổi mới tư duy lý luận (1975 – 1986), tại Đại hội VI (tháng 12/1986), Đảng đã hoạch định Đường lối Đổi mới toàn diện đất nước, mở ra bước ngoặt phát triển mới.",
  },
  {
    id: 'act4_item2',
    act: 4,
    x: 1520,
    platformId: null,
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
    triggerRadius: 85,
    title: 'Phá kho thóc Nhật (Đầu năm 1945)',
    steps: [
      {
        mode: 'timing',
        key: 'SPACE',
        keyLabel: 'SPACE',
        prompt: 'Đèn pha tuần tra quét tới! Bấm [SPACE] đúng nhịp để lách qua bóng tối!',
        duration: 2.9,
        sweetSpotStart: 0.42,
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
    x: 2680,
    triggerRadius: 85,
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
    x: 2350,
    triggerRadius: 85,
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
    x: 2660,
    triggerRadius: 85,
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
    x: 2050,
    triggerRadius: 85,
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
    x: 2560,
    triggerRadius: 95,
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

export const FINALE_EVENT = {
  act: 4,
  x: 2560,
  triggerRadius: 135,
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
