export const formatPercentage = (value: number): string => {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
};

export const formatAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatDate = (timestamp: bigint): string => {
  return new Date(Number(timestamp) * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

export function formatCompactNumber(value: number | string | bigint, decimals: number = 2) {
  value = Number(value);
  const i = value === 0 ? 0 : Math.floor(Math.log(value) / Math.log(1000));
  const sizes = ["", "K", "M", "B", "Qa", "Qi"];
  return `${(value / Math.pow(1000, i)).toFixed(decimals)} ${sizes[i]}`;
}

export function formatToken(value: number | string | bigint, tokenDecimals: number | bigint = 18, symbol: string = "") {
  const divisor = BigInt(10) ** BigInt(tokenDecimals);
  const unitValue = BigInt(value) / divisor;
  return `${formatCompactNumber(unitValue)} ${symbol}`;
}

export const formatFIL = (attoFil: string | bigint) => {
  if (!attoFil || attoFil === "0") return "0 FIL";

  const units = [
    { name: "FIL", decimals: 18 },
    { name: "milliFIL", decimals: 15 },
    { name: "microFIL", decimals: 12 },
    { name: "nanoFIL", decimals: 9 },
    { name: "picoFIL", decimals: 6 },
    { name: "femtoFIL", decimals: 3 },
    { name: "attoFIL", decimals: 0 },
  ];

  const value = BigInt(attoFil);

  for (const unit of units) {
    const divisor = BigInt(10) ** BigInt(unit.decimals);
    const unitValue = value / divisor;

    if (unitValue >= 1) {
      const decimals = unit.name === "FIL" ? 1 : 2;
      return unit.name === "FIL"
        ? `${formatCompactNumber(unitValue, decimals)} FIL`
        : `${unitValue.toString()} ${unit.name}`;
    }
  }

  return "0 FIL";
};

export function YAxisTickFormatter(value: number, isToken: boolean, tokenDecimals: number = 18) {
  return isToken
    ? (() => {
        const divisor = BigInt(10) ** BigInt(tokenDecimals);
        const unitValue = BigInt(value) / divisor;
        return `${formatCompactNumber(unitValue, 0)}`;
      })()
    : formatCompactNumber(value, 0);
}
