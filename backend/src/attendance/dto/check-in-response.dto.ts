export interface CheckInResponseDto {
  dateKey: string;
  limits: {
    vocab: number;
    kanji: number;
    grammar: number;
  };
  used: {
    vocab: number;
    kanji: number;
    grammar: number;
  };
  assigned: {
    vocabIds: string[];
    kanjiIds: string[];
    grammarIds: string[];
  };
  checkedInAt: Date;
}
