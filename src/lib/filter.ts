const BAD_WORDS = ['từ_nhạy_cảm_1', 'từ_nhạy_cảm_2', 'xúc phạm', 'phản động'];

export const containsSensitiveContent = (content: string): boolean => {
  const lowerContent = content.toLowerCase();
  return BAD_WORDS.some(word => lowerContent.includes(word.toLowerCase()));
};