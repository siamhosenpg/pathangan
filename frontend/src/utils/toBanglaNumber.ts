export function toBanglaNumber(value: number | string): string {
  const banglaDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

  return String(value).replace(
    /[0-9]/g,
    (digit) => banglaDigits[Number(digit)],
  );
}
