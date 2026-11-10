import { ACTS } from '../data/storyData.js';
import { getQuizByAct } from '../data/quizData.js';

/**
 * Hộp thoại câu hỏi trắc nghiệm cuối mỗi Màn.
 * Style nằm trong style.css (mục "QUIZ MODAL").
 */

const LETTERS = ['A', 'B', 'C', 'D'];

/** Phím tắt: 1–4 hoặc A–D → vị trí đáp án (0–3) */
function keyToOptionIndex(e) {
  const digit = /^(?:Digit|Numpad)([1-4])$/.exec(e.code);
  if (digit) return Number(digit[1]) - 1;
  const letter = /^Key([A-D])$/.exec(e.code);
  if (letter) return letter[1].charCodeAt(0) - 65;
  return -1;
}

function getResultMessage(score, total) {
  if (total > 0 && score === total) {
    return 'Xuất sắc! Bạn đã nắm vững các mốc lịch sử của màn này.';
  }
  if (score > 0) {
    return 'Khá tốt! Hãy ghi nhớ thêm các văn kiện đã thu thập để lần sau trọn điểm.';
  }
  return 'Đừng lo — hãy xem lại các văn kiện trong màn chơi rồi thử lại nhé.';
}

/** Tạo phần tử DOM: el(tag, { className, onClick, 'aria-label': ... }, ...children) */
function el(tag, attrs, ...children) {
  const node = document.createElement(tag);
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (value === undefined || value === null || value === false) continue;
      if (key === 'className') node.className = value;
      else if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
      else node.setAttribute(key, value === true ? 'true' : String(value));
    }
  }
  for (const child of children) {
    if (child === undefined || child === null || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

export default function createQuizModal({ actId, onComplete, parent } = {}) {
  const host = parent || document.body;

  // ---------- Trạng thái ----------
  let currentActId = actId;
  let questions = getQuizByAct(currentActId);
  let act = ACTS.find((a) => a.id === currentActId);

  let index = 0;
  let selected = null;
  let score = 0;
  let finished = false;

  // Tham chiếu tới các phần tử của màn hình câu hỏi hiện tại
  let headingEl = null;
  let nextBtnEl = null;
  let optionButtons = [];
  let feedbackHost = null;
  let footerEl = null;

  // ---------- Khung cố định ----------
  const card = el('section', {
    className: 'story-card quiz-card',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'quiz-heading',
  });
  const backdrop = el('div', { className: 'modal-backdrop quiz-backdrop' }, card);

  const controller = {
    element: backdrop,
    onComplete,
    setActId,
    destroy,
  };

  // ---------- Giá trị dẫn xuất ----------
  const getTotal = () => questions.length;
  const getQuestion = () => questions[index];
  const isLast = () => index === getTotal() - 1;

  // ---------- Hành động ----------
  function choose(optionIndex) {
    const question = getQuestion();
    if (selected !== null || !question || optionIndex >= question.options.length) return;
    selected = optionIndex;
    if (optionIndex === question.correctIndex) score += 1;
    applyAnswered();
    // Đã trả lời → focus nút tiếp theo
    if (nextBtnEl) nextBtnEl.focus({ preventScroll: true });
  }

  function next() {
    if (selected === null) return;
    if (isLast()) {
      finished = true;
    } else {
      index += 1;
      selected = null;
    }
    render();
  }

  function retry() {
    resetState();
    render();
  }

  function resetState() {
    index = 0;
    selected = null;
    score = 0;
    finished = false;
  }

  /** Đổi Màn → làm lại từ đầu */
  function setActId(newActId) {
    if (newActId === currentActId) return;
    currentActId = newActId;
    questions = getQuizByAct(currentActId);
    act = ACTS.find((a) => a.id === currentActId);
    resetState();
    render();
  }

  // ---------- Phím tắt ----------
  // Chặn sự kiện bàn phím lan ra game phía sau khi hộp thoại đang mở.
  function onKeyDown(e) {
    if (e.key === 'Tab' || e.ctrlKey || e.metaKey || e.altKey) return;
    e.stopPropagation();
    if (finished || e.repeat) return;
    const optionIndex = keyToOptionIndex(e);
    if (optionIndex >= 0) {
      e.preventDefault();
      choose(optionIndex);
    }
  }
  window.addEventListener('keydown', onKeyDown, true);

  function destroy() {
    window.removeEventListener('keydown', onKeyDown, true);
    backdrop.remove();
  }

  // ---------- Cập nhật tại chỗ khi đã trả lời ----------
  function updateOption(btn, i) {
    const question = getQuestion();
    const answered = selected !== null;

    let state = '';
    if (answered) {
      if (i === question.correctIndex) state = 'is-correct';
      else if (i === selected) state = 'is-wrong';
      else state = 'is-dim';
    }

    btn.className = `quiz-option ${state}`;
    btn.setAttribute('aria-disabled', String(answered));

    btn.querySelectorAll('.quiz-option-mark, .quiz-sr-only').forEach((n) => n.remove());
    if (state === 'is-correct') {
      btn.append(
        el('span', { className: 'quiz-option-mark', 'aria-hidden': 'true' }, '✓'),
        el('span', { className: 'quiz-sr-only' }, '(đáp án đúng)')
      );
    } else if (state === 'is-wrong') {
      btn.append(
        el('span', { className: 'quiz-option-mark', 'aria-hidden': 'true' }, '✕'),
        el('span', { className: 'quiz-sr-only' }, '(bạn đã chọn, chưa đúng)')
      );
    }
  }

  function applyAnswered() {
    const question = getQuestion();
    const isCorrect = selected === question.correctIndex;

    optionButtons.forEach(updateOption);

    feedbackHost.replaceChildren(
      el(
        'div',
        { className: `quiz-feedback ${isCorrect ? 'is-correct' : 'is-wrong'}` },
        el('strong', { className: 'quiz-verdict' }, isCorrect ? 'Chính xác!' : 'Chưa đúng.'),
        ' ',
        question.explanation
      )
    );

    const label = isLast() ? 'Xem kết quả' : 'Câu tiếp theo';
    if (!nextBtnEl) {
      nextBtnEl = el(
        'button',
        { type: 'button', className: 'primary-clean-btn quiz-btn', onClick: next },
        label
      );
      footerEl.append(nextBtnEl);
    } else {
      nextBtnEl.textContent = label;
    }
  }

  // ---------- Màn hình câu hỏi ----------
  function buildQuestion() {
    const question = getQuestion();
    const total = getTotal();

    optionButtons = question.options.map((text, i) => {
      const btn = el(
        'button',
        { type: 'button', className: 'quiz-option ', 'aria-disabled': 'false', onClick: () => choose(i) },
        el('span', { className: 'quiz-option-letter', 'aria-hidden': 'true' }, LETTERS[i]),
        el('span', { className: 'quiz-option-text' }, text)
      );
      return btn;
    });

    feedbackHost = el('div', { 'aria-live': 'polite' });
    nextBtnEl = null;

    footerEl = el(
      'div',
      { className: 'story-footer' },
      el(
        'span',
        { className: 'modal-hint pc-only-kbd' },
        'Phím ',
        el('kbd', null, '1'),
        '–',
        el('kbd', null, '4'),
        ' hoặc ',
        el('kbd', null, 'A'),
        '–',
        el('kbd', null, 'D'),
        ' để chọn đáp án'
      )
    );

    headingEl = el(
      'h2',
      { id: 'quiz-heading', className: 'story-title', tabindex: '-1' },
      question.question
    );

    return [
      el(
        'div',
        { className: 'quiz-counter', 'aria-label': `Câu ${index + 1} trên ${total}` },
        `Câu ${index + 1}/${total}`
      ),
      headingEl,
      el('div', { className: 'story-divider' }),
      el(
        'div',
        { className: 'quiz-body' },
        el(
          'div',
          { className: 'quiz-options', role: 'group', 'aria-label': 'Các đáp án' },
          ...optionButtons
        ),
        feedbackHost
      ),
      footerEl,
    ];
  }

  // ---------- Màn hình kết quả ----------
  function buildResult() {
    const total = getTotal();

    headingEl = el(
      'h2',
      { id: 'quiz-heading', className: 'story-title', tabindex: '-1' },
      'Kết quả thử thách'
    );
    optionButtons = [];
    feedbackHost = null;
    footerEl = null;
    nextBtnEl = null;

    return [
      headingEl,
      el('div', { className: 'story-divider' }),
      el(
        'div',
        { className: 'quiz-body quiz-result' },
        el(
          'div',
          { className: 'quiz-score', 'aria-label': `Bạn trả lời đúng ${score} trên ${total} câu` },
          el('span', { className: 'quiz-score-num' }, score),
          el('span', { className: 'quiz-score-total' }, `/ ${total}`)
        ),
        el('p', { className: 'quiz-result-msg' }, getResultMessage(score, total))
      ),
      el(
        'div',
        { className: 'story-footer quiz-footer-end' },
        el(
          'button',
          { type: 'button', className: 'subtle-action-btn quiz-btn', onClick: retry },
          'Làm lại'
        ),
        el(
          'button',
          {
            type: 'button',
            className: 'primary-clean-btn quiz-btn',
            onClick: () => {
              if (controller.onComplete) {
                controller.onComplete({ actId: currentActId, score, total });
              }
            },
          },
          'Tiếp tục'
        )
      ),
    ];
  }

  // ---------- Vẽ lại toàn bộ (khi đổi câu / màn kết quả / đổi Màn) ----------
  function render() {
    // Không có câu hỏi và chưa kết thúc → không hiển thị gì
    if (!getQuestion() && !finished) {
      backdrop.remove();
      return;
    }
    if (!backdrop.isConnected) host.append(backdrop);

    const tag = act ? `${act.shortLabel} • ${act.period}` : `Màn ${currentActId}`;

    card.replaceChildren(
      el('div', { className: 'story-tag-row' }, tag),
      ...(finished ? buildResult() : buildQuestion())
    );

    // Quản lý focus: câu hỏi mới / kết quả → tiêu đề
    if (headingEl) headingEl.focus({ preventScroll: true });
  }

  render();
  return controller;
}