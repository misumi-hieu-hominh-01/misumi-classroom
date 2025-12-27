"use client";

import { useState, useEffect, useMemo } from "react";
import { KanjiItem } from "@/api/content-api";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { attendanceApi } from "@/api/attendance-api";
import { loadProgress } from "@/utils/lesson-progress";
import { KanjiTestResult } from "./KanjiTestResult";
import { KanjiStrokeOrderTest } from "./KanjiStrokeOrderTest";

// Sample data for kunyomi readings (hiragana with various formats)
const SAMPLE_KUNYOMI = [
  // --- Single characters (Noun/Adverb) ---
  "い",
  "う",
  "え",
  "お",
  "か",
  "き",
  "く",
  "け",
  "こ",
  "さ",
  "し",
  "す",
  "せ",
  "そ",
  "た",
  "ち",
  "つ",
  "て",
  "と",
  "な",
  "に",
  "ぬ",
  "ね",
  "の",
  "は",
  "ひ",
  "ふ",
  "へ",
  "ほ",
  "ま",
  "み",
  "む",
  "め",
  "も",
  "や",
  "ゆ",
  "よ",
  "わ",

  // --- Common Verbs with Dot Notation (Stem.Okurigana) ---
  "あ.げる",
  "さ.げる",
  "お.きる",
  "お.こす",
  "た.つ",
  "た.てる",
  "のぼ.る",
  "くだ.る",
  "くだ.す",
  "あが.る",
  "さが.る",
  "おこ.る",
  "たお.れる",
  "あ.る",
  "い.る",
  "う.つ",
  "え.る",
  "お.く",
  "か.く",
  "き.く",
  "く.る",
  "け.す",
  "こ.む",
  "さ.す",
  "し.る",
  "す.る",
  "た.べる",
  "ち.る",
  "つ.く",
  "つ.くる",
  "と.る",
  "な.る",
  "に.る",
  "ぬ.ぐ",
  "ね.る",
  "の.る",
  "は.しる",
  "ひ.く",
  "ふ.る",
  "ま.つ",
  "み.る",
  "も.つ",
  "や.む",
  "よ.む",
  "わ.かる",
  "わ.らう",
  "あが.る",
  "さが.る",
  "おき.る",
  "たつ",
  "のぼ.る",
  "くだ.る",
  "あける",
  "しめ.る",
  "わす.れる",
  "たべ.る",
  "ねる",
  "みる",
  "きく",
  "かく",
  "はなす",
  "よむ",
  "かう",
  "あう",
  "いう",
  "あるく",
  "はしる",
  "およぐ",
  "まつ",
  "とる",
  "つくる",
  "おわ.る",
  "はじま.る",
  "わか.る",
  "しる",
  "わら.う",
  "おこ.る",

  // --- Adjectives (Ending with い) ---
  "あか.い",
  "しろ.い",
  "くろ.い",
  "あお.い",
  "たか.い",
  "ひく.い",
  "あつ.い",
  "さむ.い",
  "とお.い",
  "ちか.い",
  "よ.い",
  "わる.い",
  "ふる.い",
  "なが.い",
];

// Sample data for onyomi readings (katakana)
const SAMPLE_ONYOMI = [
  "イ",
  "ウ",
  "エ",
  "オ",
  "カ",
  "キ",
  "ク",
  "ケ",
  "コ",
  "サ",
  "シ",
  "ス",
  "セ",
  "ソ",
  "タ",
  "チ",
  "ツ",
  "テ",
  "ト",
  "ナ",
  "ニ",
  "ヌ",
  "ネ",
  "ノ",
  "ハ",
  "ヒ",
  "フ",
  "ヘ",
  "ホ",
  "マ",
  "ミ",
  "ム",
  "メ",
  "モ",
  "ヤ",
  "ユ",
  "ヨ",
  "ラ",
  "リ",
  "ル",
  "レ",
  "ロ",
  "ワ",
  "ヲ",
  "ン",
  "アン",
  "イン",
  "ウン",
  "エン",
  "オン",
  "カン",
  "キン",
  "クン",
  "ケン",
  "コン",
  "サン",
  "シン",
  "スン",
  "セン",
  "ソン",
  "タン",
  "チン",
  "ツン",
  "テン",
  "トン",
  "ナン",
  "ニン",
  "ヌン",
  "ネン",
  "ノン",
  "ハン",
  "ヒン",
  "フン",
  "ヘン",
  "ホン",
  "マン",
  "ミン",
  "ムン",
  "メン",
  "モン",
  "ヤン",
  "ユン",
  "ヨン",
  "ラン",
  "リン",
  "ルン",
  "レン",
  "ロン",
  "ワン",
  "ヲン",
  "ガ",
  "ギ",
  "グ",
  "ゲ",
  "ゴ",
  "ザ",
  "ジ",
  "ズ",
  "ゼ",
  "ゾ",
  "ダ",
  "ヂ",
  "ヅ",
  "デ",
  "ド",
  "バ",
  "ビ",
  "ブ",
  "ベ",
  "ボ",
  "パ",
  "ピ",
  "プ",
  "ペ",
  "ポ",
  "キャ",
  "キュ",
  "キョ",
  "シャ",
  "シュ",
  "ショ",
  "チャ",
  "チュ",
  "チョ",
  "ニャ",
  "ニュ",
  "ニョ",
  "ヒャ",
  "ヒュ",
  "ヒョ",
  "ミャ",
  "ミュ",
  "ミョ",
  "リャ",
  "リュ",
  "リョ",
  "ギャ",
  "ギュ",
  "ギョ",
  "ジャ",
  "ジュ",
  "ジョ",
  "ビャ",
  "ビュ",
  "ビョ",
  "ピャ",
  "ピュ",
  "ピョ",
];

// Sample Hán Việt readings for wrong answers
const SAMPLE_HANVIET = [
  "THIÊN",
  "HÀNH",
  "HẬU",
  "ĐỊA",
  "TÂN",
  "TỬ",
  "THIỆN",
  "ĐÔNG",
  "GIANG",
  "HỎA",
  "CỰU",
  "TẢO",
  "NHIỆT",
  "SINH",
  "KIẾN",
  "XUYÊN",
  "ẨM",
  "MỸ",
  "LÃNH",
  "ĐOẢN",
  "SƠN",
  "THỦY",
  "NHẬP",
  "CẬN",
  "NGOẠI",
  "TẢ",
  "VIẾT",
  "THỰC",
  "TRUNG",
  "CAO",
  "HÀ",
  "KIM",
  "NAM",
  "TRÚ",
  "MÃN",
  "TRÌ",
  "ĐÊ",
  "TIỂU",
  "VĂN",
  "LỢI",
  "BẮC",
  "CẤU",
  "NGUYỆT",
  "TINH",
  "THỊ",
  "ÁC",
  "ÔN",
  "HỮU",
  "HẢI",
  "XUẤT",
  "TẬP",
  "THỰC",
  "TÂY",
  "LƯƠNG",
  "HẠI",
  "QUY",
  "HỌC",
  "TRƯỜNG",
  "XẤU",
  "TỐC",
  "THÍNH",
  "THƯỢNG",
  "KHIẾT",
  "VIỄN",
  "MỘC",
  "THỔ",
  "NỘI",
  "NGÔN",
  "HẠ",
  "GIÁC",
  "ĐỘC",
  "TIỀN",
  "NHẬT",
  "TÁO",
  "CỨU",
  "HƯ",
  "THẤP",
  "PHIẾN",
  "ĐẠI",
  "ÂM",
  "DƯƠNG",
  "CƯƠNG",
  "NHU",
  "THẮNG",
  "PHỤ",
  "CHIẾN",
  "HÒA",
  "CÔNG",
  "TƯ",
  "KHINH",
  "TRỌNG",
  "HỮU",
  "VÔ",
  "PHÚ",
  "BẦN",
  "SANG",
  "HÈN",
  "THỦ",
  "CÔNG",
];

// Sample meanings for wrong answers
const SAMPLE_MEANINGS = [
  "Kim loại",
  "Gỗ cây",
  "Nước lã",
  "Ngọn lửa",
  "Đất đai",
  "Bầu trời",
  "Mặt đất",
  "Mặt trời",
  "Mặt trăng",
  "Vì sao",
  "Núi non",
  "Sông ngòi",
  "Biển cả",
  "Trường giang",
  "Sông ngòi",
  "Phương đông",
  "Phương tây",
  "Phương nam",
  "Phương bắc",
  "Trung tâm",
  "Phía trên",
  "Phía dưới",
  "Phía trước",
  "Phía sau",
  "Bên trái",
  "Bên phải",
  "Nội bộ",
  "Bên ngoài",
  "Xa xôi",
  "Gần gũi",
  "To lớn",
  "Nhỏ bé",
  "Trường tồn",
  "Ngắn ngủi",
  "Cao quý",
  "Thấp kém",
  "Chân thật",
  "Hư ảo",
  "Lương thiện",
  "Độc ác",
  "Mỹ lệ",
  "Xấu xí",
  "Lợi ích",
  "Tổn hại",
  "Cứu giúp",
  "Sinh tồn",
  "Tử vong",
  "Học vấn",
  "Luyện tập",
  "Độc giả",
  "Viết lách",
  "Văn chương",
  "Thính giác",
  "Ngôn ngữ",
  "Thị giác",
  "Kiến thức",
  "Hành động",
  "Xuất hiện",
  "Nhập cảnh",
  "Trở về",
  "Cư trú",
  "Thực phẩm",
  "Ẩm thực",
  "Ngủ say",
  "Giác ngộ",
  "Tân thời",
  "Cựu trào",
  "Nhiệt độ",
  "Lãnh đạm",
  "Ôn hòa",
  "Thanh lương",
  "Khô ráo",
  "Ẩm thấp",
  "Thanh khiết",
  "Cấu uế",
  "Tốc độ",
  "Trì trệ",
  "Sớm mai",
  "Thỏa mãn",
  "Âm tính",
  "Dương tính",
  "Cương quyết",
  "Mềm mỏng",
  "Chiến thắng",
  "Thua cuộc",
  "Chiến tranh",
  "Hòa bình",
  "Công cộng",
  "Riêng tư",
  "Nhẹ nhàng",
  "Trọng yếu",
  "Sở hữu",
  "Hư vô",
  "Giàu có",
  "Nghèo khó",
  "Cao sang",
  "Thấp hèn",
  "Phòng thủ",
  "Tấn công",
  "Biến đổi",
  "Cải thiện",
  "Cách tân",
  "Phương pháp",
  "Luật lệ",
  "Chế ngự",
  "Mức độ",
  "Cơ mật",
  "Quan trọng",
  "Cung cấp",
  "Thái độ",
  "Mức độ",
  "Tình trạng",
  "Thái độ",
  "Khả năng",
  "Sức lực",
  "Phát kiến",
  "Tiến triển",
  "Hoàn thành",
  "Kết quả",
];

interface KanjiQuestion {
  kanjiId: string;
  kanji: string;
  questionType: "strokeOrder" | "multiReading";
  subQuestions?: {
    type: "hanviet" | "meaning" | "onyomi" | "kunyomi";
    question: string;
    correctAnswer: string;
    rowIndex: number; // 0-3 for row 1-4
  }[];
  allOptions?: string[][]; // 4 rows of 4 options each
  isCompleted?: boolean;
}

interface KanjiTestProps {
  kanjis: KanjiItem[];
  onClose: () => void;
  onTestComplete?: (score: number, total: number) => void;
  unlockNext?: () => void;
  nextLessonName?: string;
}

export function KanjiTest({
  kanjis,
  onClose,
  onTestComplete,
  unlockNext,
  nextLessonName,
}: KanjiTestProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentSubQuestionIndex, setCurrentSubQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Map<number, Map<number, number>>
  >(new Map()); // questionIndex -> subQuestionIndex -> answerIndex
  const [strokeOrderCompleted, setStrokeOrderCompleted] = useState<
    Map<number, boolean>
  >(new Map());
  const [showResult, setShowResult] = useState(false);
  const [isRetryMode, setIsRetryMode] = useState(false);

  // Fetch daily state to get checkedInAt date
  const { data: dailyState } = useQuery({
    queryKey: ["daily-state"],
    queryFn: () => attendanceApi.getStatus(),
  });

  // Shuffle kanjis
  const shuffledKanjis = useMemo(() => {
    return [...kanjis].sort(() => Math.random() - 0.5);
  }, [kanjis]);

  // Generate questions: 2 questions per kanji (stroke order + multi-reading)
  const questions = useMemo(() => {
    const allQuestions: KanjiQuestion[] = [];

    shuffledKanjis.forEach((kanji) => {
      // Question 1: Stroke Order Test
      allQuestions.push({
        kanjiId: kanji._id,
        kanji: kanji.kanji,
        questionType: "strokeOrder",
        isCompleted: false,
      });

      // Question 2: Multi-Reading Test (4 sub-questions with 16 answers)
      const hasOnyomi = kanji.onyomi && kanji.onyomi.length > 0;
      const hasKunyomi = kanji.kunyomi && kanji.kunyomi.length > 0;
      const hasMeaning = kanji.meaningVi && kanji.meaningVi.length > 0;
      const hasHanmean = kanji.hanmean && kanji.hanmean.length > 0;

      // Prepare sub-questions
      const subQuestions = [];

      // Row 1: Hán Việt
      if (hasHanmean) {
        subQuestions.push({
          type: "hanviet" as const,
          question: "Cách đọc Hán Việt của kanji này là gì?",
          correctAnswer: kanji.hanmean![0],
          rowIndex: 0,
        });
      }

      // Row 2: Meaning
      if (hasMeaning) {
        subQuestions.push({
          type: "meaning" as const,
          question: "Nghĩa của kanji này là gì?",
          correctAnswer: kanji.meaningVi![0],
          rowIndex: 1,
        });
      }

      // Row 3: Onyomi
      if (hasOnyomi) {
        subQuestions.push({
          type: "onyomi" as const,
          question: "Cách đọc On'yomi của kanji này là gì?",
          correctAnswer: kanji.onyomi![0],
          rowIndex: 2,
        });
      }

      // Row 4: Kunyomi
      if (hasKunyomi) {
        subQuestions.push({
          type: "kunyomi" as const,
          question: "Cách đọc Kun'yomi của kanji này là gì?",
          correctAnswer: kanji.kunyomi![0],
          rowIndex: 3,
        });
      }

      // Generate 16 options (4 rows x 4 options)
      const allOptions: string[][] = [[], [], [], []];

      // Collect data from other kanjis
      const otherKanjis = shuffledKanjis.filter((k) => k._id !== kanji._id);

      // Helper function to get wrong answers
      const getWrongAnswers = (
        type: "hanviet" | "meaning" | "onyomi" | "kunyomi",
        correctAnswer: string,
        count: number
      ): string[] => {
        const wrongAnswers: string[] = [];
        const sourcePool: string[] = [];

        // Collect from other kanjis
        otherKanjis.forEach((k) => {
          if (type === "hanviet" && k.hanmean) {
            sourcePool.push(...k.hanmean);
          } else if (type === "meaning" && k.meaningVi) {
            sourcePool.push(...k.meaningVi);
          } else if (type === "onyomi" && k.onyomi) {
            sourcePool.push(...k.onyomi);
          } else if (type === "kunyomi" && k.kunyomi) {
            sourcePool.push(...k.kunyomi);
          }
        });

        // Add sample data based on type
        if (type === "onyomi") {
          sourcePool.push(...SAMPLE_ONYOMI);
        } else if (type === "kunyomi") {
          sourcePool.push(...SAMPLE_KUNYOMI);
        } else if (type === "hanviet") {
          sourcePool.push(...SAMPLE_HANVIET);
        } else if (type === "meaning") {
          sourcePool.push(...SAMPLE_MEANINGS);
        }

        // Filter, deduplicate and shuffle
        const uniquePool = Array.from(
          new Set(sourcePool.filter((item) => item !== correctAnswer))
        ).sort(() => Math.random() - 0.5);

        // Take required count
        for (let i = 0; i < count && i < uniquePool.length; i++) {
          wrongAnswers.push(uniquePool[i]);
        }

        // If not enough, generate more from sample data
        while (wrongAnswers.length < count) {
          let random: string;
          if (type === "hanviet") {
            random =
              SAMPLE_HANVIET[Math.floor(Math.random() * SAMPLE_HANVIET.length)];
          } else if (type === "meaning") {
            random =
              SAMPLE_MEANINGS[
                Math.floor(Math.random() * SAMPLE_MEANINGS.length)
              ];
          } else if (type === "onyomi") {
            random =
              SAMPLE_ONYOMI[Math.floor(Math.random() * SAMPLE_ONYOMI.length)];
          } else if (type === "kunyomi") {
            random =
              SAMPLE_KUNYOMI[Math.floor(Math.random() * SAMPLE_KUNYOMI.length)];
          } else {
            // Fallback (should not happen)
            random = "";
          }
          if (
            random &&
            !wrongAnswers.includes(random) &&
            random !== correctAnswer
          ) {
            wrongAnswers.push(random);
          }
        }

        return wrongAnswers;
      };

      // Generate options for each row
      subQuestions.forEach((subQ) => {
        const wrongAnswers = getWrongAnswers(subQ.type, subQ.correctAnswer, 3);
        const rowOptions = [subQ.correctAnswer, ...wrongAnswers].sort(
          () => Math.random() - 0.5
        );
        allOptions[subQ.rowIndex] = rowOptions;
      });

      // Fill empty rows with dummy data
      for (let i = 0; i < 4; i++) {
        if (allOptions[i].length === 0) {
          allOptions[i] = ["—", "—", "—", "—"];
        }
      }

      if (subQuestions.length > 0) {
        allQuestions.push({
          kanjiId: kanji._id,
          kanji: kanji.kanji,
          questionType: "multiReading",
          subQuestions,
          allOptions,
          isCompleted: false,
        });
      }
    });

    return allQuestions;
  }, [shuffledKanjis]);

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const currentSubQuestion =
    currentQuestion?.questionType === "multiReading"
      ? currentQuestion.subQuestions?.[currentSubQuestionIndex]
      : null;

  // Get kanji item for current question to access strokes
  const currentKanjiItem = useMemo(() => {
    if (!currentQuestion) return null;
    return shuffledKanjis.find((k) => k._id === currentQuestion.kanjiId);
  }, [currentQuestion, shuffledKanjis]);

  // Load test progress from localStorage when component mounts
  useEffect(() => {
    if (!dailyState?.checkedInAt || questions.length === 0) return;

    const checkedInDate = new Date(dailyState.checkedInAt);
    const dateKey = checkedInDate.toISOString().split("T")[0];
    const savedProgress = loadProgress("kanji", dateKey);

    // If test was already passed 100%, auto-complete all questions
    if (
      savedProgress?.testPassed &&
      savedProgress.testScore !== undefined &&
      savedProgress.testTotal !== undefined &&
      savedProgress.testScore === savedProgress.testTotal
    ) {
      // Mark all stroke order questions as completed
      const completedMap = new Map<number, boolean>();
      const answersMap = new Map<number, Map<number, number>>();

      questions.forEach((question, index) => {
        if (question.questionType === "strokeOrder") {
          completedMap.set(index, true);
        } else if (
          question.questionType === "multiReading" &&
          question.subQuestions &&
          question.allOptions
        ) {
          // For multi-reading questions, set all correct answers
          const subAnswersMap = new Map<number, number>();
          question.subQuestions.forEach((subQ, subIndex) => {
            const correctIndex = question.allOptions![subQ.rowIndex].indexOf(
              subQ.correctAnswer
            );
            if (correctIndex !== -1) {
              subAnswersMap.set(subIndex, correctIndex);
            }
          });
          answersMap.set(index, subAnswersMap);
        }
      });

      setStrokeOrderCompleted(completedMap);
      setSelectedAnswers(answersMap);
    }
  }, [dailyState?.checkedInAt, questions, totalQuestions]);

  function handleAnswerSelect(rowIndex: number, optionIndex: number) {
    if (currentQuestion?.questionType !== "multiReading") return;
    if (!currentSubQuestion || currentSubQuestion.rowIndex !== rowIndex) return;

    setSelectedAnswers((prev) => {
      const newMap = new Map(prev);
      let subMap = newMap.get(currentQuestionIndex);
      if (!subMap) {
        subMap = new Map();
        newMap.set(currentQuestionIndex, subMap);
      }
      subMap.set(currentSubQuestionIndex, optionIndex);
      return newMap;
    });

    // Auto move to next sub-question after a short delay
    setTimeout(() => {
      if (currentQuestion?.questionType === "multiReading") {
        const totalSubQuestions = currentQuestion.subQuestions?.length || 0;
        if (currentSubQuestionIndex < totalSubQuestions - 1) {
          setCurrentSubQuestionIndex(currentSubQuestionIndex + 1);
        }
        // If it's the last sub-question, don't auto-move (user can click "Tiếp theo" to go to next main question)
      }
    }, 500);
  }

  function handleStrokeOrderComplete() {
    // Mark stroke order question as completed
    setStrokeOrderCompleted((prev) => {
      const newMap = new Map(prev);
      newMap.set(currentQuestionIndex, true);
      return newMap;
    });

    // Auto move to next question after a short delay
    setTimeout(() => {
      handleNext();
    }, 500);
  }

  function handleStrokeOrderSkip() {
    // Mark stroke order question as completed (skip)
    setStrokeOrderCompleted((prev) => {
      const newMap = new Map(prev);
      newMap.set(currentQuestionIndex, true);
      return newMap;
    });

    // Auto move to next question
    handleNext();
  }

  function handleNext() {
    if (isLastQuestion) {
      // Show results
      setShowResult(true);
    } else {
      // Find next question, skip completed stroke order questions
      let nextIndex = currentQuestionIndex + 1;
      while (nextIndex < totalQuestions) {
        const nextQuestion = questions[nextIndex];
        // If it's a completed stroke order question, skip it
        if (
          nextQuestion.questionType === "strokeOrder" &&
          strokeOrderCompleted.get(nextIndex)
        ) {
          nextIndex++;
        } else {
          break;
        }
      }
      if (nextIndex < totalQuestions) {
        setCurrentQuestionIndex(nextIndex);
        setCurrentSubQuestionIndex(0);
      } else {
        // All remaining questions are completed stroke orders, show results
        setShowResult(true);
      }
    }
  }

  function handlePrevious() {
    // Always go to previous main question, not previous sub-question
    // User can use arrow buttons in "Câu hỏi X/4" section to navigate between sub-questions
    if (currentQuestionIndex > 0) {
      // Find previous question, skip completed stroke order questions
      let prevIndex = currentQuestionIndex - 1;
      while (prevIndex >= 0) {
        const prevQuestion = questions[prevIndex];
        // If it's a completed stroke order question, skip it
        if (
          prevQuestion.questionType === "strokeOrder" &&
          strokeOrderCompleted.get(prevIndex)
        ) {
          prevIndex--;
        } else {
          break;
        }
      }
      if (prevIndex >= 0) {
        const prevQuestion = questions[prevIndex];
        setCurrentQuestionIndex(prevIndex);
        // If previous question is multi-reading, go to first sub-question
        if (prevQuestion.questionType === "multiReading") {
          setCurrentSubQuestionIndex(0);
        } else {
          setCurrentSubQuestionIndex(0);
        }
      } else {
        // All previous questions are completed stroke orders, go to first question
        setCurrentQuestionIndex(0);
        setCurrentSubQuestionIndex(0);
      }
    }
  }

  // Auto-skip completed stroke order questions when navigating
  useEffect(() => {
    if (!currentQuestion) return;

    if (
      currentQuestion.questionType === "strokeOrder" &&
      strokeOrderCompleted.get(currentQuestionIndex)
    ) {
      // Auto skip to next question after a short delay
      const timer = setTimeout(() => {
        if (isLastQuestion) {
          setShowResult(true);
        } else {
          let nextIndex = currentQuestionIndex + 1;
          while (nextIndex < totalQuestions) {
            const nextQuestion = questions[nextIndex];
            if (
              nextQuestion.questionType === "strokeOrder" &&
              strokeOrderCompleted.get(nextIndex)
            ) {
              nextIndex++;
            } else {
              break;
            }
          }
          if (nextIndex < totalQuestions) {
            setCurrentQuestionIndex(nextIndex);
          } else {
            setShowResult(true);
          }
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [
    currentQuestionIndex,
    currentQuestion,
    strokeOrderCompleted,
    questions,
    isLastQuestion,
    totalQuestions,
  ]);

  function handleConfirm() {
    const currentQ = questions[currentQuestionIndex];
    if (currentQ.questionType === "strokeOrder") {
      // For stroke order, check if completed
      if (strokeOrderCompleted.has(currentQuestionIndex)) {
        handleNext();
      }
    } else if (currentQ.questionType === "multiReading") {
      // For multi-reading questions, check if ALL sub-questions are answered
      const subMap = selectedAnswers.get(currentQuestionIndex);
      const totalSubQuestions = currentQ.subQuestions?.length || 0;
      const allAnswered =
        subMap &&
        totalSubQuestions > 0 &&
        Array.from({ length: totalSubQuestions }).every((_, idx) =>
          subMap.has(idx)
        );

      if (allAnswered) {
        // All sub-questions answered, move to next main question
        handleNext();
      }
    }
  }

  // Calculate score
  const correctAnswers = useMemo(() => {
    let correct = 0;
    questions.forEach((question, index) => {
      if (question.questionType === "strokeOrder") {
        // Stroke order question is correct if completed
        if (strokeOrderCompleted.get(index)) {
          correct++;
        }
      } else if (question.questionType === "multiReading") {
        // Multi-reading question - each sub-question counts as 1
        const subMap = selectedAnswers.get(index);
        if (subMap && question.subQuestions && question.allOptions) {
          question.subQuestions.forEach((subQ, subIndex) => {
            const selectedIndex = subMap.get(subIndex);
            if (selectedIndex !== undefined) {
              const selectedAnswer =
                question.allOptions![subQ.rowIndex][selectedIndex];
              if (selectedAnswer === subQ.correctAnswer) {
                correct++;
              }
            }
          });
        }
      }
    });
    return correct;
  }, [questions, selectedAnswers, strokeOrderCompleted]);

  // Calculate total questions (stroke order + all sub-questions)
  const totalSubQuestions = useMemo(() => {
    return questions.reduce((total, q) => {
      if (q.questionType === "strokeOrder") return total + 1;
      if (q.questionType === "multiReading")
        return total + (q.subQuestions?.length || 0);
      return total;
    }, 0);
  }, [questions]);

  // Calculate answered questions (not necessarily correct)
  const answeredQuestions = useMemo(() => {
    let answered = 0;
    questions.forEach((question, index) => {
      if (question.questionType === "strokeOrder") {
        // Stroke order question is answered if completed
        if (strokeOrderCompleted.get(index)) {
          answered++;
        }
      } else if (question.questionType === "multiReading") {
        // Multi-reading question - count answered sub-questions
        const subMap = selectedAnswers.get(index);
        if (subMap && question.subQuestions) {
          question.subQuestions.forEach((_, subIndex) => {
            if (subMap.has(subIndex)) {
              answered++;
            }
          });
        }
      }
    });
    return answered;
  }, [questions, selectedAnswers, strokeOrderCompleted]);

  if (showResult) {
    return (
      <KanjiTestResult
        totalQuestions={totalQuestions}
        correctAnswers={correctAnswers}
        questions={questions}
        selectedAnswers={selectedAnswers}
        strokeOrderCompleted={strokeOrderCompleted}
        kanjis={shuffledKanjis}
        onRetry={() => {
          setShowResult(false);
          setCurrentQuestionIndex(0);
          setCurrentSubQuestionIndex(0);
          setSelectedAnswers(new Map());
          // Keep completed stroke orders, don't reset them
          setIsRetryMode(true);
        }}
        onClose={onClose}
        onTestComplete={onTestComplete}
        unlockNext={unlockNext}
        nextLessonName={nextLessonName}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Kiểm tra Kanji</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Question Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {currentQuestion && (
            <div className="max-w-3xl mx-auto space-y-8">
              {/* Kanji Display */}
              <div className="text-center">
                {currentQuestion.questionType === "strokeOrder" ? (
                  // Check if already completed, if so skip automatically
                  strokeOrderCompleted.get(currentQuestionIndex) ? (
                    <div className="mb-6 space-y-4">
                      <div className="h-96 w-full max-w-2xl mx-auto flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-6xl mb-4">✓</div>
                          <p className="text-lg text-green-600 font-semibold">
                            Đã hoàn thành nét vẽ
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            Tự động chuyển sang câu tiếp theo...
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Show stroke order test
                    <div className="mb-6 space-y-4">
                      <div className="h-96 w-full max-w-2xl mx-auto">
                        <KanjiStrokeOrderTest
                          kanji={currentQuestion.kanji}
                          strokes={currentKanjiItem?.strokes}
                          onComplete={handleStrokeOrderComplete}
                          onSkip={handleStrokeOrderSkip}
                          isRetry={isRetryMode}
                        />
                      </div>
                    </div>
                  )
                ) : currentQuestion.questionType === "multiReading" &&
                  currentSubQuestion ? (
                  // Show text for multi-reading questions
                  <>
                    <div className="text-8xl font-medium text-gray-900 mb-4">
                      {currentQuestion.kanji}
                    </div>
                    <div className="text-lg text-gray-600">
                      {currentSubQuestion.question}
                    </div>
                    <div className="flex items-center justify-center gap-3 mt-4">
                      <button
                        onClick={() => {
                          if (currentSubQuestionIndex > 0) {
                            setCurrentSubQuestionIndex(
                              currentSubQuestionIndex - 1
                            );
                          }
                        }}
                        disabled={currentSubQuestionIndex === 0}
                        className="p-2 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </button>
                      <div className="text-sm font-semibold text-blue-600 px-4 py-2 bg-blue-50 rounded-lg">
                        Câu hỏi {currentSubQuestionIndex + 1}/
                        {currentQuestion.subQuestions?.length || 0}
                      </div>
                      <button
                        onClick={() => {
                          const totalSub =
                            currentQuestion.subQuestions?.length || 0;
                          if (currentSubQuestionIndex < totalSub - 1) {
                            setCurrentSubQuestionIndex(
                              currentSubQuestionIndex + 1
                            );
                          }
                        }}
                        disabled={
                          currentSubQuestionIndex ===
                          (currentQuestion.subQuestions?.length || 1) - 1
                        }
                        className="p-2 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>
                  </>
                ) : null}
              </div>

              {/* Answer Options - Only show for multi-reading questions */}
              {currentQuestion.questionType === "multiReading" &&
                currentQuestion.allOptions &&
                currentSubQuestion && (
                  <div className="space-y-3">
                    {currentQuestion.allOptions.map((rowOptions, rowIndex) => {
                      const isActiveRow =
                        currentSubQuestion.rowIndex === rowIndex;
                      const subMap = selectedAnswers.get(currentQuestionIndex);
                      const selectedInThisRow = subMap?.get(
                        currentQuestion.subQuestions?.findIndex(
                          (sq) => sq.rowIndex === rowIndex
                        ) ?? -1
                      );
                      const hasAnswer = selectedInThisRow !== undefined;

                      return (
                        <div key={rowIndex} className="flex items-center gap-3">
                          {/* Row Number - Clickable */}
                          <button
                            onClick={() => {
                              // Find sub-question index for this row
                              const subQIndex =
                                currentQuestion.subQuestions?.findIndex(
                                  (sq) => sq.rowIndex === rowIndex
                                );
                              if (subQIndex !== undefined && subQIndex >= 0) {
                                setCurrentSubQuestionIndex(subQIndex);
                              }
                            }}
                            className={`w-10 h-10 flex-shrink-0 rounded-lg flex items-center justify-center font-bold text-lg transition-all ${
                              isActiveRow
                                ? "bg-blue-500 text-white shadow-md"
                                : hasAnswer
                                ? "bg-green-500 text-white hover:bg-green-600 cursor-pointer"
                                : "bg-gray-200 text-gray-500 hover:bg-gray-300 cursor-pointer"
                            }`}
                          >
                            {rowIndex + 1}
                          </button>

                          {/* Options Grid */}
                          <div className="flex-1 grid grid-cols-4 gap-2">
                            {rowOptions.map((option, optionIndex) => {
                              const isSelected =
                                selectedInThisRow === optionIndex;
                              const isCurrentSelection =
                                isActiveRow && isSelected;
                              const isPreviousSelection =
                                !isActiveRow && isSelected;

                              return (
                                <button
                                  key={optionIndex}
                                  onClick={() =>
                                    handleAnswerSelect(rowIndex, optionIndex)
                                  }
                                  disabled={
                                    !isActiveRow && !isPreviousSelection
                                  }
                                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                                    isCurrentSelection
                                      ? "border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-300"
                                      : isPreviousSelection
                                      ? "border-green-500 bg-green-50 shadow-sm"
                                      : isActiveRow
                                      ? "border-gray-300 hover:border-blue-300 hover:bg-blue-50/50"
                                      : "border-gray-200 bg-gray-50 cursor-not-allowed opacity-50"
                                  }`}
                                >
                                  <div className="text-base font-medium text-gray-900 truncate">
                                    {option}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between gap-4 max-w-3xl mx-auto">
            {/* Progress Bar */}
            <div className="flex-1 max-w-xs">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">
                  Đã trả lời: {answeredQuestions}/{totalSubQuestions}
                </span>
                <span className="font-semibold text-gray-900">
                  {totalSubQuestions > 0
                    ? Math.round((answeredQuestions / totalSubQuestions) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                  style={{
                    width: `${
                      totalSubQuestions > 0
                        ? (answeredQuestions / totalSubQuestions) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <button
                onClick={handleConfirm}
                disabled={
                  currentQuestion.questionType === "strokeOrder"
                    ? !strokeOrderCompleted.has(currentQuestionIndex)
                    : currentQuestion.questionType === "multiReading"
                    ? (() => {
                        const subMap =
                          selectedAnswers.get(currentQuestionIndex);
                        const totalSubQuestions =
                          currentQuestion.subQuestions?.length || 0;
                        // Check if all sub-questions are answered
                        return (
                          !subMap ||
                          totalSubQuestions === 0 ||
                          !Array.from({ length: totalSubQuestions }).every(
                            (_, idx) => subMap.has(idx)
                          )
                        );
                      })()
                    : true
                }
                className={`px-8 py-3 rounded-xl font-semibold text-white transition-all ${
                  currentQuestion.questionType === "strokeOrder"
                    ? strokeOrderCompleted.has(currentQuestionIndex)
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg"
                      : "bg-gray-300 cursor-not-allowed"
                    : currentQuestion.questionType === "multiReading"
                    ? (() => {
                        const subMap =
                          selectedAnswers.get(currentQuestionIndex);
                        const totalSubQuestions =
                          currentQuestion.subQuestions?.length || 0;
                        const allAnswered =
                          subMap &&
                          totalSubQuestions > 0 &&
                          Array.from({ length: totalSubQuestions }).every(
                            (_, idx) => subMap.has(idx)
                          );
                        return allAnswered
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg"
                          : "bg-gray-300 cursor-not-allowed";
                      })()
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                {isLastQuestion ? "Xem kết quả" : "Tiếp theo"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
