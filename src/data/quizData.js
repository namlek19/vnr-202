/**
 * Dữ liệu câu hỏi trắc nghiệm cho 4 Màn (1930 – Nay).
 *
 * Mỗi Màn có 2 câu hỏi cơ bản, mỗi câu gồm 4 đáp án (A, B, C, D).
 * - correctIndex: vị trí đáp án đúng trong mảng options (bắt đầu từ 0).
 * - explanation: lời giải thích ngắn hiển thị sau khi người chơi trả lời.
 */

export const QUIZ_DATA = [
  // ==================== MÀN 1 (1930 – 1945) ====================
  {
    act: 1,
    questions: [
      {
        id: 'quiz_1_1',
        question:
          'Khẩu hiệu “Phá kho thóc, giải quyết nạn đói” nhằm giải quyết vấn đề cấp bách nào lúc bấy giờ?',
        options: [
          'Cứu đói khẩn cấp cho nhân dân, qua đó tập hợp quần chúng và thổi bùng ngọn lửa tiền khởi nghĩa.',
          'Tích trữ lương thực dự phòng để chuẩn bị cho một cuộc kháng chiến lâu dài ở vùng rừng núi.',
          'Tạo nguồn viện trợ lương thực khẩn cấp cho quân đội Đồng minh khi tiến vào giải giáp quân Nhật.',
          'Phá hoại tuyến vận tải biển của quân đội Nhật sang các nước thuộc khu vực Đông Nam Á.',
        ],
        correctIndex: 0,
        explanation:
          'Khẩu hiệu “Phá kho thóc, giải quyết nạn đói” vừa cứu đói khẩn cấp cho nhân dân, vừa tập hợp quần chúng, góp phần thổi bùng ngọn lửa tiền khởi nghĩa.',
      },
      {
        id: 'quiz_1_2',
        question:
          'Ngày 2/9/1945, Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập ở đâu và tuyên bố sự ra đời của nhà nước nào?',
        options: [
          'Quảng trường Nhà hát Lớn Hà Nội; khai sinh nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.',
          'Quảng trường Ba Đình (Hà Nội); khai sinh nước Việt Nam Dân chủ Cộng hòa.',
          'Quảng trường Cách mạng Tháng Tám (Hà Nội); khai sinh Chính phủ Liên hiệp Lâm thời.',
          'Phủ Chủ tịch (Hà Nội); khai sinh nước Việt Nam Độc lập Đồng minh.',
        ],
        correctIndex: 1,
        explanation:
          'Ngày 2/9/1945, tại Quảng trường Ba Đình (Hà Nội), Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập, khai sinh nước Việt Nam Dân chủ Cộng hòa.',
      },
    ],
  },

  // ==================== MÀN 2 (1945 – 1954) ====================
  {
    act: 2,
    questions: [
      {
        id: 'quiz_2_1',
        question:
          'Chủ tịch Hồ Chí Minh ra Lời kêu gọi toàn quốc kháng chiến vào thời điểm nào và trong bối cảnh nào?',
        options: [
          'Ngày 23/9/1945; khi thực dân Pháp nổ súng đánh chiếm lại Sài Gòn - Chợ Lớn.',
          'Ngày 6/3/1946; khi Pháp và ta vừa ký Hiệp định Sơ bộ để hòa hoãn.',
          'Đêm ngày 19/12/1946; khi thực dân Pháp liên tiếp khiêu khích và gửi tối hậu thư đòi tước vũ khí của ta.',
          'Ngày 14/9/1946; khi Tạm ước Việt - Pháp ký kết tại Paris bị phía Pháp xé bỏ hoàn toàn.',
        ],
        correctIndex: 2,
        explanation:
          'Đêm 19/12/1946, trước những hành động khiêu khích và tối hậu thư đòi tước vũ khí của thực dân Pháp, Bác Hồ ra Lời kêu gọi toàn quốc kháng chiến.',
      },
      {
        id: 'quiz_2_2',
        question:
          'Trong quá trình chuẩn bị Chiến dịch Điện Biên Phủ, Đại tướng Võ Nguyên Giáp đã quyết định thay đổi phương châm tác chiến như thế nào?',
        options: [
          'Chuyển từ "Đánh du kích" sang "Vây lấn, tiêu diệt từng cụm cứ điểm".',
          'Chuyển từ "Đánh nhanh, thắng nhanh" sang "Đánh chắc, tiến chắc".',
          'Chuyển từ "Phòng ngự chiều sâu" sang "Tiến công thọc sâu thần tốc".',
          'Chuyển từ "Đánh chắc, tiến chắc" sang "Đánh nhanh, thắng nhanh".',
        ],
        correctIndex: 1,
        explanation:
          'Đại tướng Võ Nguyên Giáp quyết định chuyển từ phương châm "Đánh nhanh, thắng nhanh" sang "Đánh chắc, tiến chắc", góp phần quyết định đến thắng lợi của chiến dịch.',
      },
    ],
  },

  // ==================== MÀN 3 (1954 – 1975) ====================
  {
    act: 3,
    questions: [
      {
        id: 'quiz_3_1',
        question:
          'Trong cuộc kháng chiến chống Mỹ, miền Bắc giữ vai trò gì đối với miền Nam?',
        options: [
          'Hậu phương lớn chi viện cho tiền tuyến lớn miền Nam',
          'Tiền tuyến lớn nhận chi viện từ miền Nam',
          'Chỉ tập trung đấu tranh trên mặt trận ngoại giao',
          'Chỉ khôi phục kinh tế, không tham gia chi viện',
        ],
        correctIndex: 0,
        explanation:
          'Miền Bắc cung cấp sức người, sức của phục vụ cuộc kháng chiến ở miền Nam.',
      },
      {
        id: 'quiz_3_2',
        question:
          'Sự kiện xe tăng húc đổ cổng Dinh Độc Lập cuối Màn 3 gắn với chiến thắng nào?',
        options: [
          'Chiến thắng Điện Biên Phủ ngày 7/5/1954',
          'Chiến thắng Chiến dịch Hồ Chí Minh ngày 30/4/1975',
          'Chiến thắng Chiến dịch Biên giới năm 1950',
          'Chiến thắng “Điện Biên Phủ trên không” năm 1972',
        ],
        correctIndex: 1,
        explanation:
          'Chiến thắng đánh dấu giải phóng hoàn toàn miền Nam, kết thúc cuộc kháng chiến chống Mỹ, cứu nước.',
      },
    ],
  },

  // ==================== MÀN 4 (1975 – Nay) ====================
  {
    act: 4,
    questions: [
      {
        id: 'quiz_4_1',
        question:
          'Hình ảnh người dân xếp hàng mua hàng thời bao cấp minh họa cho nội dung nào?',
        options: [
          'Những khó khăn kinh tế, xã hội trước Đổi mới',
          'Sự phát triển của thương mại điện tử',
          'Thành tựu hội nhập kinh tế quốc tế',
          'Quá trình hiện đại hóa hệ thống điện quốc gia',
        ],
        correctIndex: 0,
        explanation:
          'Bức ảnh minh họa tình trạng thiếu thốn hàng hóa và khó khăn trong đời sống người dân thời kỳ này.',
      },
      {
        id: 'quiz_4_2',
        question:
          'Đường lối Đổi mới toàn diện đất nước được đề ra tại Đại hội nào của Đảng?',
        options: [
          'Đại hội III, tháng 9/1960',
          'Đại hội IV, tháng 12/1976',
          'Đại hội V, tháng 3/1982',
          'Đại hội VI, tháng 12/1986',
        ],
        correctIndex: 3,
        explanation:
          'Đại hội VI đề ra đường lối Đổi mới toàn diện, mở ra bước ngoặt phát triển của đất nước.',
      },
    ],
  },
];

/**
 * Lấy danh sách câu hỏi theo Màn
 * @param {number} actId - Số thứ tự Màn (1 – 4)
 * @returns {Array} Mảng 2 câu hỏi của Màn đó
 */
export function getQuizByAct(actId) {
  const entry = QUIZ_DATA.find((q) => q.act === actId);
  return entry ? entry.questions : [];
}

/**
 * Kiểm tra đáp án người chơi chọn
 * @param {string} questionId - id của câu hỏi
 * @param {number} selectedIndex - vị trí đáp án đã chọn
 * @returns {boolean} true nếu đúng
 */
export function checkAnswer(questionId, selectedIndex) {
  for (const entry of QUIZ_DATA) {
    const q = entry.questions.find((item) => item.id === questionId);
    if (q) return q.correctIndex === selectedIndex;
  }
  return false;
}