export type CurrencyConfig = {
  code: string;
  label: string;
  rateUnit: number;
  quickAmounts: number[];
};

const currencyConfigs: Record<string, CurrencyConfig> = {
  JP: { code: "JPY", label: "엔", rateUnit: 100, quickAmounts: [100, 500, 1000, 5000] },
  CN: { code: "CNY", label: "위안", rateUnit: 1, quickAmounts: [10, 50, 100, 500] },
  TW: { code: "TWD", label: "대만 달러", rateUnit: 1, quickAmounts: [100, 500, 1000, 5000] },
  HK: { code: "HKD", label: "홍콩 달러", rateUnit: 1, quickAmounts: [50, 100, 500, 1000] },
  SG: { code: "SGD", label: "싱가포르 달러", rateUnit: 1, quickAmounts: [10, 50, 100, 500] },
  TH: { code: "THB", label: "바트", rateUnit: 1, quickAmounts: [100, 500, 1000, 5000] },
  VN: { code: "VND", label: "동", rateUnit: 1000, quickAmounts: [10000, 50000, 100000, 500000] },
  PH: { code: "PHP", label: "필리핀 페소", rateUnit: 1, quickAmounts: [100, 500, 1000, 5000] },
  ID: { code: "IDR", label: "루피아", rateUnit: 1000, quickAmounts: [10000, 50000, 100000, 500000] },
  MY: { code: "MYR", label: "링깃", rateUnit: 1, quickAmounts: [10, 50, 100, 500] },
  US: { code: "USD", label: "미국 달러", rateUnit: 1, quickAmounts: [10, 50, 100, 500] },
  CA: { code: "CAD", label: "캐나다 달러", rateUnit: 1, quickAmounts: [10, 50, 100, 500] },
  MX: { code: "MXN", label: "멕시코 페소", rateUnit: 1, quickAmounts: [100, 500, 1000, 5000] },
  GB: { code: "GBP", label: "파운드", rateUnit: 1, quickAmounts: [10, 20, 50, 100] },
  FR: { code: "EUR", label: "유로", rateUnit: 1, quickAmounts: [10, 20, 50, 100] },
  DE: { code: "EUR", label: "유로", rateUnit: 1, quickAmounts: [10, 20, 50, 100] },
  IT: { code: "EUR", label: "유로", rateUnit: 1, quickAmounts: [10, 20, 50, 100] },
  ES: { code: "EUR", label: "유로", rateUnit: 1, quickAmounts: [10, 20, 50, 100] },
  PT: { code: "EUR", label: "유로", rateUnit: 1, quickAmounts: [10, 20, 50, 100] },
  NL: { code: "EUR", label: "유로", rateUnit: 1, quickAmounts: [10, 20, 50, 100] },
  BE: { code: "EUR", label: "유로", rateUnit: 1, quickAmounts: [10, 20, 50, 100] },
  CH: { code: "CHF", label: "스위스 프랑", rateUnit: 1, quickAmounts: [10, 20, 50, 100] },
  AT: { code: "EUR", label: "유로", rateUnit: 1, quickAmounts: [10, 20, 50, 100] },
  CZ: { code: "CZK", label: "체코 코루나", rateUnit: 1, quickAmounts: [100, 500, 1000, 5000] },
  HU: { code: "HUF", label: "포린트", rateUnit: 100, quickAmounts: [1000, 5000, 10000, 50000] },
  GR: { code: "EUR", label: "유로", rateUnit: 1, quickAmounts: [10, 20, 50, 100] },
  TR: { code: "TRY", label: "튀르키예 리라", rateUnit: 1, quickAmounts: [100, 500, 1000, 5000] },
  AU: { code: "AUD", label: "호주 달러", rateUnit: 1, quickAmounts: [10, 50, 100, 500] },
  NZ: { code: "NZD", label: "뉴질랜드 달러", rateUnit: 1, quickAmounts: [10, 50, 100, 500] },
  AE: { code: "AED", label: "디르함", rateUnit: 1, quickAmounts: [10, 50, 100, 500] },
};

export function getCurrencyConfig(destinationCountry?: string) {
  if (!destinationCountry) return undefined;
  return currencyConfigs[destinationCountry];
}

