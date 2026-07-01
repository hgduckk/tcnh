const BAD_WORDS = [
  // ── 1. NHÓM PHẢN ĐỘNG, CHÍNH TRỊ NHẠY CẢM ──────────────────────────────────
  'phản động', 'bạo động', 'biểu tình', 'lật đổ', 'chính quyền', 
  'đảng cộng sản', 'nhà nước', 'chính trị', 'tuyên truyền', 'xuyên tạc',
  'quốc gia', 'cách mạng màu', 'khủng bố', 'phản quốc', 'đảo chính',

  // ── 2. NHÓM XÚC PHẠM, ĐỒNG THỊ, MIỆT THỊ ──────────────────────────────────
  'xúc phạm', 'súc vật', 'ngu ngốc', 'đồ ngu', 'vô học', 'mất dạy',
  'thằng chó', 'con điên', 'bú đít', 'liếm bô', 'đồ hèn', 'nhục nhã',
  'kỳ thị', 'bê đê', 'gay lọ', 'hút máu', 'bóc lột', 'lừa đảo',

  // ── 3. NHÓM CHỬI THỀ, THÔ TỤC CƠ BẢN (TIẾNG VIỆT) ─────────────────────────
  'đm', 'dm', 'vcl', 'vcl', 'clm', 'cl', 'đmm', 'dmm', 'vđ', 'vd',
  'địt', 'dit', 'đếch', 'dech', 'mẹ mày', 'me may', 'cha mày', 'cha may',
  'chó đẻ', 'cho de', 'cặc', 'cac', 'lồn', 'lon', 'buồi', 'buoi',
  'đéo', 'deo', 'đểu', 'chết tiệt', 'vãi lìn', 'vãi lồn', 'vãi cả chưởng',

  // ── 4. NHÓM TỪ VIẾT TẮT, KÝ TỰ CÁCH ĐIỆU (TRÁNH LỌT LƯỚI) ──────────────────
  'd.m', 'đ.m', 'v.c.l', 'v.l', 'đ_m', 'd_m', 'ch0', 'c4c', '10n', 'bui',
  'thang cho', 'con cho', 'luadao', 'phan dong', 'xuc pham',

  // ── 5. NHÓM TIẾNG ANH THÔ TỤC PHỔ BIẾN ────────────────────────────────────
  'fuck', 'fck', 'shit', 'bitch', 'asshole', 'bastard', 'dick', 'pussy',
  'wanker', 'motherfucker', 'cunt', 'slut', 'whore', 'idiot', 'stupid'
];
export const containsSensitiveContent = (content: string): boolean => {
  const lowerContent = content.toLowerCase();
  return BAD_WORDS.some(word => lowerContent.includes(word.toLowerCase()));
};