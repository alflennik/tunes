export function titleToTrain(TitleCase) {
  return TitleCase.replace(/[A-Z]/g, (letter, offset) => {
    if (offset === 0) return letter.toLowerCase();
    return "-" + letter.toLowerCase();
  });
}
