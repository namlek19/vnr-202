/**
 * Dữ liệu câu hỏi trắc nghiệm cho 4 Màn (1930 – Nay).
 * Nội dung câu hỏi được xây dựng dựa trên storyData.js.
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
        question: 'Đảng Cộng sản Việt Nam được thành lập vào ngày nào?',
        options: ['2/9/1945', '3/2/1930', '19/5/1941', '30/4/1975'],
        correctIndex: 1,
        explanation:
          'Hội nghị hợp nhất do Nguyễn Ái Quốc chủ trì đầu năm 1930; ngày 3/2/1930 được lấy làm ngày kỷ niệm thành lập Đảng.',
      },
      {
        id: 'quiz_1_2',
        question: 'Bản Tuyên ngôn Độc lập khai sinh nước Việt Nam Dân chủ Cộng hòa được đọc tại đâu?',
        options: ['Hang Pác Bó', 'Dinh Độc Lập', 'Quảng trường Ba Đình', 'Điện Biên Phủ'],
        correctIndex: 2,
        explanation:
          'Ngày 2/9/1945, Tuyên ngôn Độc lập được đọc tại Quảng trường Ba Đình, Hà Nội.',
      },
    ],
  },

  // ==================== MÀN 2 (1945 – 1954) ====================
  {
    act: 2,
    questions: [
      {
        id: 'quiz_2_1',
        question: 'Chủ tịch Hồ Chí Minh ra Lời kêu gọi toàn quốc kháng chiến vào ngày nào?',
        options: ['6/1/1946', '25/11/1945', '2/9/1945', '19/12/1946'],
        correctIndex: 3,
        explanation:
          'Ngày 19/12/1946, trước hành động bội ước của thực dân Pháp, Bác Hồ ra Lời kêu gọi toàn quốc kháng chiến.',
      },
      {
        id: 'quiz_2_2',
        question: 'Chiến thắng lịch sử ngày 7/5/1954 "lừng lẫy năm châu, chấn động địa cầu" diễn ra ở đâu?',
        options: ['Điện Biên Phủ', 'Hà Nội', 'Cao Bằng', 'Sài Gòn'],
        correctIndex: 0,
        explanation:
          'Chiến dịch Điện Biên Phủ toàn thắng ngày 7/5/1954, buộc thực dân Pháp phải ký Hiệp định Giơnevơ.',
      },
    ],
  },

  // ==================== MÀN 3 (1954 – 1975) ====================
  {
    act: 3,
    questions: [
      {
        id: 'quiz_3_1',
        question: 'Chiến dịch Hồ Chí Minh toàn thắng, miền Nam được giải phóng hoàn toàn vào ngày nào?',
        options: ['2/9/1945', '30/4/1975', '7/5/1954', '19/12/1946'],
        correctIndex: 1,
        explanation:
          'Ngày 30/4/1975, xe tăng Quân Giải phóng húc đổ cổng Dinh Độc Lập, đất nước thống nhất.',
      },
      {
        id: 'quiz_3_2',
        question:
          'Trong kháng chiến chống Mỹ, quân và dân hai miền Nam – Bắc luôn giữ vững chân lý nào?',
        options: [
          'Dân tộc trên hết, Tổ quốc trên hết',
          'Phá kho thóc, giải quyết nạn đói',
          'Không có gì quý hơn độc lập, tự do',
          'Đánh chắc, tiến chắc',
        ],
        correctIndex: 2,
        explanation:
          'Chân lý "Không có gì quý hơn độc lập, tự do" là tinh thần xuyên suốt của quân dân ta trong kháng chiến chống Mỹ.',
      },
    ],
  },

  // ==================== MÀN 4 (1975 – Nay) ====================
  {
    act: 4,
    questions: [
      {
        id: 'quiz_4_1',
        question: 'Tháng 12/1986, Đại hội VI của Đảng đã đề ra đường lối nào cho đất nước?',
        options: ['Kháng chiến kiến quốc', 'Tổng khởi nghĩa', 'Đổi mới', 'Toàn quốc kháng chiến'],
        correctIndex: 2,
        explanation:
          'Đại hội VI (12/1986) hoạch định Đường lối Đổi mới toàn diện, mở ra bước ngoặt phát triển mới cho đất nước.',
      },
      {
        id: 'quiz_4_2',
        question: 'Việt Nam gia nhập Tổ chức Thương mại Thế giới (WTO) vào năm nào?',
        options: ['1976', '1986', '1954', '2006'],
        correctIndex: 3,
        explanation:
          'Ngày 7/11/2006, Việt Nam gia nhập WTO, đánh dấu bước tiến quan trọng trong hội nhập kinh tế quốc tế.',
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