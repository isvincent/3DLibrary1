export const quizzes = [
  {
    q: "每人最多可借幾本書？",
    options: ["2 本", "4 本", "6 本"],
    answer: 1,
    explanation: "每人最多 4 本，借期 2 週。",
  },
  {
    q: "可以帶礦泉水進圖書館嗎？",
    options: ["可以", "不可以"],
    answer: 1,
    explanation: "不得攜帶飲食，包含礦泉水。",
  },
  {
    q: "漫畫可以借回家嗎？",
    options: ["可以", "僅供館內閱讀"],
    answer: 1,
    explanation: "漫畫與當月期刊僅限館內閱讀。",
  },
  {
    q: "上課時間要如何留館？",
    options: ["自行進入", "攜學生證登記並取得教師同意文件"],
    answer: 1,
    explanation: "須攜學生證，並經導師或任課老師簽署洽公證明。",
  },
  {
    q: "閱讀桌可用來製作海報嗎？",
    options: ["可以", "不可以"],
    answer: 1,
    explanation: "全區不外借非閱讀活動。",
  },
  {
    q: "兩本書分別逾期 2 天與 3 天，暫停借閱幾天？",
    options: ["3 天", "5 天", "2 天"],
    answer: 1,
    explanation: "累計每本書逾期天數，共 5 天。",
  },
  {
    q: "續借應何時辦理？",
    options: ["到期日前 1～2 日", "逾期後再辦"],
    answer: 0,
    explanation: "到期前 1～2 日到館或透過查詢系統續借 2 週。",
  },
];
export function scoreAnswers(answers) {
  return Math.round(
    (quizzes.reduce((s, q, i) => s + (answers[i] === q.answer ? 1 : 0), 0) /
      quizzes.length) *
      100,
  );
}
