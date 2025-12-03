export interface ConsumeQuotaResponseDto {
  used: {
    vocab: number;
    kanji: number;
    grammar: number;
  };
  success: boolean;
}
