export function predictNumbers(open, b4) {
  if (open === "" || b4 === "") {
    return [];
  }

  const o = Number(open);
  const b = Number(b4);

  return [
    (o + b) % 100,
    (o + b + 10) % 100,
    (o + b + 20) % 100,
    (o + b + 30) % 100,
    (o + b + 40) % 100,
    (o + b + 50) % 100,
  ].map((n) => n.toString().padStart(2, "0"));
}   