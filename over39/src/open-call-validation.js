export const MAX_PORTFOLIO_BYTES = 10 * 1024 * 1024;

export function isHttpUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function validatePortfolioFileMetadata(file) {
  if (!file) return { valid: true, errors: [] };
  const errors = [];
  if (file.size > MAX_PORTFOLIO_BYTES) errors.push("포트폴리오 PDF는 10 MB 이하여야 합니다.");
  if (file.type !== "application/pdf") errors.push("파일 형식은 PDF(application/pdf)만 가능합니다.");
  if (!/\.pdf$/i.test(file.name || "")) errors.push("파일 이름의 확장자가 .pdf인지 확인해주세요.");
  return { valid: errors.length === 0, errors };
}

export function hasPdfSignature(bytes) {
  if (!bytes || bytes.length < 5) return false;
  return String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-";
}

export function validatePortfolioSelection({ file, portfolioUrl }) {
  const errors = [...validatePortfolioFileMetadata(file).errors];
  const url = String(portfolioUrl || "").trim();
  if (!file && !url) errors.push("포트폴리오 PDF 또는 URL 가운데 하나를 제출해주세요.");
  if (url && !isHttpUrl(url)) errors.push("포트폴리오 URL은 http:// 또는 https:// 주소여야 합니다.");
  return { valid: errors.length === 0, errors };
}
