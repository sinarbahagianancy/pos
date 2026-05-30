/**
 * Convert number to Indonesian words (Terbilang)
 * Example: 27000000 → "Dua puluh tujuh juta"
 */

const ONES = [
  "",
  "satu",
  "dua",
  "tiga",
  "empat",
  "lima",
  "enam",
  "tujuh",
  "delapan",
  "sembilan",
  "sepuluh",
  "sebelas",
  "dua belas",
  "tiga belas",
  "empat belas",
  "lima belas",
  "enam belas",
  "tujuh belas",
  "delapan belas",
  "sembilan belas",
];

const TENS = [
  "",
  "",
  "dua puluh",
  "tiga puluh",
  "empat puluh",
  "lima puluh",
  "enam puluh",
  "tujuh puluh",
  "delapan puluh",
  "sembilan puluh",
];

function convertHundreds(num: number): string {
  if (num === 0) return "";

  let result = "";

  if (num >= 100) {
    if (num === 100) {
      result = "seratus";
    } else {
      result = ONES[Math.floor(num / 100)] + " ratus";
    }
    num %= 100;
  }

  if (num >= 12) {
    const tens = Math.floor(num / 10);
    const ones = num % 10;
    result += (result ? " " : "") + TENS[tens];
    if (ones > 0) {
      result += " " + ONES[ones];
    }
  } else if (num >= 1) {
    result += (result ? " " : "") + ONES[num];
  }

  return result;
}

export function terbilang(num: number): string {
  if (num === 0) return "nol";

  // Round to integer
  num = Math.round(num);

  // Handle negative
  if (num < 0) {
    return "minus " + terbilang(-num);
  }

  let result = "";

  // Miliar (billions)
  if (num >= 1_000_000_000) {
    const miliar = Math.floor(num / 1_000_000_000);
    result += convertHundreds(miliar) + " miliar";
    num %= 1_000_000_000;
  }

  // Juta (millions)
  if (num >= 1_000_000) {
    const juta = Math.floor(num / 1_000_000);
    result += (result ? " " : "") + convertHundreds(juta) + " juta";
    num %= 1_000_000;
  }

  // Ribu (thousands)
  if (num >= 1000) {
    const ribu = Math.floor(num / 1000);
    result += result ? " " : "";
    if (ribu === 1) {
      result += "seribu";
    } else {
      result += convertHundreds(ribu) + " ribu";
    }
    num %= 1000;
  }

  // Hundreds/Tens/Ones
  if (num > 0) {
    result += (result ? " " : "") + convertHundreds(num);
  }

  // Capitalize first letter
  return result.charAt(0).toUpperCase() + result.slice(1);
}

export default terbilang;
