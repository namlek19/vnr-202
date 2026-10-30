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
      { minX: 0, maxX: 860, name: 'Đình làng & Căn hầm bí mật (1930)' },
      { minX: 860, maxX: 1680, name: 'Suối Lê-nin & Hang Pác Bó — Cao Bằng' },
      { minX: 1680, maxX: 2490, name: 'Kho thóc Nhật & Tháp canh tuần tra' },
      { minX: 2490, maxX: 3100, name: 'Quảng trường Ba Đình lịch sử' },
    ],
    subrooms: [
      { x: 515, x1: 450, x2: 750, kind: 'underground', label: 'Hầm bí mật' },
      { x: 1365, x1: 1200, x2: 1550, kind: 'cave', label: 'Hang Pác Bó' },
    ],
    combatStarX: 2335,
    // dy > 0: trũng sâu dưới lòng đất (hầm bí mật cắt lớp +180px, lòng suối); dy < 0: cao lên (lễ đài)
    groundProfile: [
      [0, 0],
      [448, 0],
      // Căn hầm bí mật cắt lớp 2D sâu dưới nền nhà tranh (x = 450..750, dy = +180px)
      [464, 180],
      [736, 180],
      [752, 0],
      [910, 0],
      // Lòng suối Lê-nin dưới chân thác nước & vách đá vôi Pác Bó
      [995, 28],
      [1565, 28],
      [1645, 0],
      // Sân Kho thóc Nhật phẳng có 3 ụ rơm / bụi tre ẩn nấp
      [2520, 0],
      // Thềm cao Quảng trường Ba Đình
      [2615, -22],
      [3000, -22],
    ],
    platforms: [
      // Sàn ván gỗ nhà tranh trên mặt đất (bấm S / ▼ mở nắp hầm đi cầu thang gỗ xuống hầm bí mật +180px)
      { id: 'p1_thatched_floor', x1: 430, x2: 765, dy: 0, style: 'thatched_hut_floor' },
      { id: 'p1_cellar_step1', x1: 466, x2: 548, dy: 60, style: 'wood_stair_step' },
      { id: 'p1_cellar_step2', x1: 505, x2: 588, dy: 120, style: 'wood_stair_step' },
      // 3 Bậc đá thác nước dẫn sâu vào lòng Hang đá vôi Pác Bó cắt lớp 2D (x = 1200..1550)
      { id: 'p1_rock1', x1: 965, x2: 1088, dy: -46, style: 'pacbo_waterfall_step' },
      { id: 'p1_rock2', x1: 1072, x2: 1196, dy: -96, style: 'pacbo_waterfall_step' },
      { id: 'p1_rock3', x1: 1185, x2: 1545, dy: -146, style: 'pacbo_cave_mouth' },
      { id: 'p1_rock4', x1: 1532, x2: 1622, dy: -72, style: 'pacbo_ledge' },
      // 3 Ụ rơm lớn kết hợp bụi tre đặt cách quãng trước Kho thóc Nhật làm chỗ ẩn nấp đèn pha
      { id: 'p1_hay1', x1: 1920, x2: 2005, dy: -44, style: 'haystack_cover' },
      { id: 'p1_hay2', x1: 2050, x2: 2135, dy: -50, style: 'haystack_cover' },
      { id: 'p1_hay3', x1: 2175, x2: 2260, dy: -45, style: 'haystack_cover' },
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
      { minX: 0, maxX: 760, name: 'Lớp học Bình dân học vụ' },
      { minX: 760, maxX: 1540, name: 'Nhà phố cổ 2 tầng & Chiến lũy Hà Nội' },
      { minX: 1540, maxX: 2070, name: 'Đèo dốc Tây Bắc' },
      { minX: 2070, maxX: 3100, name: 'Giao thông hào & Cứ điểm Điện Biên Phủ' },
    ],
    subrooms: [
      { x: 1200, x1: 1050, x2: 1350, kind: 'interior', label: 'Nhà phố cổ 2 tầng' },
    ],
    secondaryCombatX: 1445,
    combatStarX: 2592,
    groundProfile: [
      [0, 0],
      [1545, 0],
      // Đèo dốc Tây Bắc
      [1700, -48],
      [1860, -76],
      [2010, -28],
      [2075, 0],
      // Hố giao thông hào Điện Biên Phủ số 1 (trũng sâu +52px để chiến sĩ khom mình nấp đạn)
      [2098, 52],
      [2192, 52],
      [2214, 0],
      // Ụ đất & Hàng rào dây thép gai số 1 -> Hố giao thông hào số 2
      [2252, 0],
      [2274, 52],
      [2368, 52],
      [2390, 0],
      // Ụ đất số 2 -> Hố giao thông hào xung kích số 3 -> Khoảng trống đặt bộc phá sát Lô cốt (2532..2600)
      [2416, 0],
      [2436, 52],
      [2512, 52],
      [2532, 0],
      [3000, 0],
    ],
    platforms: [
      // Chiến lũy đầu phố & Mặt cắt nội thất Nhà phố cổ 2 tầng Hà Nội (1050..1350: Tầng 1 -> Cầu thang gỗ -> Gác xép -> Ban công Loa phát thanh)
      { id: 'p2_barricade_low', x1: 830, x2: 935, dy: -46, style: 'barricade' },
      { id: 'p2_house_stair1', x1: 1072, x2: 1172, dy: -50, style: 'hanoi_wood_stair' },
      { id: 'p2_house_mezz', x1: 1152, x2: 1278, dy: -98, style: 'hanoi_wood_mezzanine' },
      { id: 'p2_tram_top', x1: 1235, x2: 1392, dy: -142, style: 'hanoi_balcony' },
      { id: 'p2_barricade_out', x1: 1385, x2: 1495, dy: -50, style: 'barricade' },
      // Nóc hầm chỉ huy Đờ Cátơri mái vòm thép
      { id: 'p2_bunker_roof', x1: 2615, x2: 2775, dy: -54, style: 'bunker_roof' },
    ],
    // Chiến lũy chắn ngang cuối nhà cổ hướng người chơi đi vào tầng 1 nhà cổ (1050) leo cầu thang gỗ lên tầng 2!
    obstacles: [
      {
        id: 'obs_hanoi_barricade',
        x1: 1352,
        x2: 1412,
        dy: -54,
        hint: '[W] Leo cầu thang gỗ trong nhà cổ lên tầng 2',
      },
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
      { minX: 0, maxX: 980, name: 'Đường mòn & Hầm chữ A chỉ huy Trường Sơn' },
      { minX: 980, maxX: 1450, name: 'Cầu treo vượt vực suối Trường Sơn' },
      { minX: 1450, maxX: 2220, name: 'Đồi Pháo cao xạ 37mm & Tọa độ lửa' },
      { minX: 2220, maxX: 3100, name: 'Đại lộ Sài Gòn — Dinh Độc Lập' },
    ],
    subrooms: [
      { x: 515, x1: 450, x2: 750, kind: 'underground', label: 'Hầm chữ A Trường Sơn' },
    ],
    secondaryCombatX: 1730,
    combatStarX: 2545,
    groundProfile: [
      // Đường rừng lên đồi -> Lối ngầm xuống Hầm chữ A chỉ huy Trường Sơn dưới rễ cây cổ thụ (x = 450..750, dy = +170px)
      [0, 0],
      [250, -34],
      [435, 0],
      [448, 0],
      [464, 170],
      [736, 170],
      [752, 0],
      [835, -26],
      [955, -8],
      [1035, 0],
      // Vực suối sâu bên dưới Cầu treo Trường Sơn
      [1095, 62],
      [1355, 62],
      [1415, 0],
      // Leo lên Mỏm đồi cao đặt 2 Khẩu đội Pháo cao xạ phòng không 37mm (x = 1662 & 1796)
      [1520, -38],
      [1645, -82],
      [1815, -82],
      [1915, 0],
      // Hố bom tọa độ lửa -> Đổ xuống đại lộ phẳng tiến thẳng vào cổng Dinh Độc Lập
      [1960, 48],
      [2125, 48],
      [2195, 0],
      [2550, 0],
      [2645, -16],
      [3000, -16],
    ],
    platforms: [
      // Nền rừng & rễ cây cổ thụ che trên nóc Hầm chữ A (bấm S / ▼ xuống bậc thang gỗ vào hầm +170px)
      { id: 'p3_bunker_roof', x1: 430, x2: 765, dy: 0, style: 'jungle_bunker_roof' },
      { id: 'p3_bunker_step1', x1: 466, x2: 548, dy: 56, style: 'wood_stair_step' },
      { id: 'p3_bunker_step2', x1: 505, x2: 588, dy: 114, style: 'wood_stair_step' },
      // Cầu treo Trường Sơn có dây văng và ván gỗ bắc qua vực suối
      { id: 'p3_bridge', x1: 1040, x2: 1410, dy: -16, style: 'wood_bridge' },
      // Bậc đá dưới lòng suối để nhảy lên bờ nếu người chơi tụt xuống suối
      { id: 'p3_stream_step', x1: 1285, x2: 1400, dy: 18, style: 'pacbo_ledge' },
    ],
    obstacles: [],
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
      { minX: 0, maxX: 980, name: 'Đại lộ Bình minh — Cổng Trường Đại học' },
      { minX: 980, maxX: 1980, name: 'Đô thị Hiện đại — Cầu dây văng & Tuyến Metro' },
      { minX: 1980, maxX: 3100, name: 'Đồi Tùng Bách & Đài tưởng niệm Tổ quốc ghi công' },
    ],
    subrooms: [],
    combatStarX: 2560,
    groundProfile: [
      [0, 0],
      [1980, 0],
      // Chân đồi Tùng Bách (nơi Ông & Cha hội ngộ cùng Cháu ở localX ~ 2000)
      [2120, -18],
      // 5 Bậc tam cấp đá trang nghiêm dẫn lên Đài tưởng niệm Tổ quốc ghi công
      [2175, -30],
      [2220, -30],
      [2238, -42],
      [2283, -42],
      [2301, -54],
      [2346, -54],
      [2364, -66],
      [2409, -66],
      [2427, -78],
      [3000, -78],
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
    x: 635,
    platformId: null, // Dưới đáy Hầm bí mật cắt lớp 2D (dy = +180px)
    checklistLabel: 'Cương lĩnh đầu tiên (2/1930)',
    locationHint: 'Hầm bí mật ▼',
    iconType: 'manifesto_table',
    tag: 'Mốc 3/2/1930',
    title: 'Bản Cương lĩnh trên bàn gỗ (Mốc 3/2/1930)',
    content:
      "Đầu năm 1930, tại Cửu Long (Hồng Kông), lãnh tụ Nguyễn Ái Quốc chủ trì Hội nghị hợp nhất các tổ chức cộng sản, thành lập Đảng Cộng sản Việt Nam (lấy ngày 3/2/1930 làm ngày kỷ niệm). Hội nghị thông qua Chánh cương vắn tắt và Sách lược vắn tắt — Cương lĩnh chính trị đầu tiên của Đảng, xác định nhiệm vụ chủ yếu trước mắt là: 'Đánh đổ đế quốc chủ nghĩa Pháp và bọn phong kiến, làm cho nước Nam được hoàn toàn độc lập', chấm dứt sự khủng hoảng về đường lối cứu nước.",
  },
  {
    id: 'act1_item2',
    act: 1,
    x: 1435,
    platformId: 'p1_rock3', // Sâu trong lòng Hang Cốc Bó — Pác Bó cắt lớp 2D (nhảy W lên 3 bậc thác nước)
    checklistLabel: 'Mặt trận Việt Minh (5/1941)',
    locationHint: 'Hang Pác Bó ▲',
    iconType: 'viet_minh_flag',
    tag: 'Mốc 5/1941',
    title: 'Chủ trương thành lập Mặt trận Việt Minh (Mốc 5/1941)',
    content:
      "Trước cảnh nhân dân chịu cảnh 'một cổ hai tròng' Pháp - Nhật, tháng 5/1941, Nguyễn Ái Quốc chủ trì Hội nghị Trung ương lần thứ tám tại Cao Bằng, đặt nhiệm vụ giải phóng dân tộc lên hàng đầu: 'Trong lúc này quyền lợi của bộ phận, của giai cấp phải đặt dưới sự sinh tử, tồn vong của quốc gia, của dân tộc'. Hội nghị quyết định thành lập Mặt trận Việt Minh (ngày 19/5/1941), tập hợp rộng rãi mọi người dân có lòng yêu nước thương nòi cùng đứng lên giành độc lập, tự do.",
  },
  {
    id: 'act1_item3',
    act: 1,
    x: 1810,
    platformId: null,
    checklistLabel: 'Phá kho thóc Nhật (3/1945)',
    locationHint: 'Sân kho thóc',
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
    checklistLabel: 'Kháng chiến kiến quốc (1945–1946)',
    locationHint: 'Lớp Bình dân',
    iconType: 'rice_jar_blackboard',
    tag: '1945 – 1946',
    title: 'Hũ gạo tiết kiệm & Bảng đen Bình dân học vụ (1945 – 1946)',
    content:
      "Sau ngày độc lập, chính quyền cách mạng non trẻ đứng trước tình thế 'ngàn cân treo sợi tóc': ngân khố kiệt quệ, kho bạc trống rỗng, 95% dân số thất học, mù chữ, thù trong giặc ngoài bủa vây. Ngày 25/11/1945, Trung ương Đảng ra Chỉ thị 'Kháng chiến kiến quốc' với khẩu hiệu 'Dân tộc trên hết, Tổ quốc trên hết', đồng thời phát động diệt giặc đói, diệt giặc dốt, diệt giặc ngoại xâm và tổ chức thắng lợi cuộc Tổng tuyển cử đầu tiên ngày 6/1/1946.",
  },
  {
    id: 'act2_item2',
    act: 2,
    x: 1328,
    platformId: 'p2_tram_top', // Đặt trên ban công tầng 2 Nhà phố cổ Hà Nội cắt lớp 2D
    checklistLabel: 'Lời kêu gọi kháng chiến (19/12/1946)',
    locationHint: 'Tầng 2 Nhà cổ ▲',
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
    checklistLabel: 'Chiến dịch Điện Biên Phủ (1954)',
    locationHint: 'Đèo Tây Bắc',
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
    x: 642,
    platformId: null, // Dưới Hầm chữ A chỉ huy Trường Sơn cắt lớp 2D (dy = +170px)
    checklistLabel: 'Nghị quyết Đại hội III (9/1960)',
    locationHint: 'Hầm chữ A ▼',
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
    checklistLabel: 'Chân lý Độc lập Tự do (1965–1973)',
    locationHint: 'Chân đồi Cao xạ',
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
    checklistLabel: 'Thống nhất & Đổi mới (12/1986)',
    locationHint: 'Sân Đại học',
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
    checklistLabel: 'Công nghiệp hóa & Hội nhập',
    locationHint: 'Đại lộ Đô thị',
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
