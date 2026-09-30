/**
 * Common Indian Bank -> IFSC Prefix Mapping and Resolution Utilities
 * 
 * Resolves 4-character IFSC prefixes for major Indian banks.
 * Handles case-insensitive normalized lookups and minor naming differences (e.g. trailing dots, "Ltd", etc.).
 */

export const bankToIfscPrefix: Record<string, string> = {
  'state bank of india': 'SBIN',
  'sbi': 'SBIN',
  'hdfc bank': 'HDFC',
  'hdfc': 'HDFC',
  'icici bank': 'ICIC',
  'icici': 'ICIC',
  'axis bank': 'UTIB',
  'axis': 'UTIB',
  'punjab national bank': 'PUNB',
  'pnb': 'PUNB',
  'bank of baroda': 'BARB',
  'bob': 'BARB',
  'bank of india': 'BKID',
  'boi': 'BKID',
  'canara bank': 'CNRB',
  'union bank of india': 'UBIN',
  'indian bank': 'IDIB',
  'indian overseas bank': 'IOBA',
  'iob': 'IOBA',
  'central bank of india': 'CBIN',
  'bank of maharashtra': 'MAHB',
  'uco bank': 'UCBA',
  'yes bank': 'YESB',
  'indusind bank': 'INDB',
  'federal bank': 'FDRL',
  'south indian bank': 'SIBL',
  'karnataka bank': 'KARB',
  'karur vysya bank': 'KVBL',
  'rbl bank': 'RATN',
  'kotak mahindra bank': 'KKBK',
  'kotak bank': 'KKBK',
  'kotak': 'KKBK',
  'jammu and kashmir bank': 'JAKA',
  'jammu & kashmir bank': 'JAKA',
  'j&k bank': 'JAKA',
  'idbi bank': 'IBKL',
  'idbi': 'IBKL',
  'bandhan bank': 'BDBL',
  'city union bank': 'CIUB',
  'dhanlaxmi bank': 'DLXB',
  'tamilnad mercantile bank': 'TMBL',
  'dcb bank': 'DCBL',
  'punjab & sind bank': 'PSIB',
  'punjab and sind bank': 'PSIB',
  'au small finance bank': 'AUBL',
  'equitas small finance bank': 'ESFB',
  'ujjivan small finance bank': 'UJVN',
  'paytm payments bank': 'PYTM',
  'airtel payments bank': 'AIRP',
  'india post payments bank': 'IPOS',
};

/**
 * Normalizes bank names for safe lookups by lowercasing, trimming, and stripping punctuation.
 *
 * Example:
 * "State Bank of India." -> "state bank of india"
 */
export const normalizeBankName = (bankName: string): string => {
  return bankName
    .trim()
    .toLowerCase()
    .replace(/[.,]/g, '')
    .replace(/\s+/g, ' ');
};

/**
 * Resolves the IFSC prefix for a bank.
 * 
 * Priority:
 * 1. If the API provides a bank code/IFSC prefix, use the API-provided code.
 * 2. If the API provides only the bank name, use bankToIfscPrefix with normalized lookup.
 * 3. If neither provides a usable prefix, do not guess the prefix. Return null to keep bank-match validation unavailable.
 * 
 * @param bankName - Name of the bank (from user input or bankList API)
 * @param apiProvidedCode - Optional code/prefix directly from API response
 * @returns 4-character IFSC prefix or null
 */
export const getIfscPrefixForBank = (
  bankName?: string,
  apiProvidedCode?: string
): string | null => {
  // 1. If API provides bank code/IFSC prefix, use the API-provided code
  if (apiProvidedCode && apiProvidedCode.trim().length >= 4) {
    return apiProvidedCode.trim().slice(0, 4).toUpperCase();
  }

  if (!bankName || !bankName.trim()) {
    return null;
  }

  const normalized = normalizeBankName(bankName);

  // 2. Direct lookup in mapping
  if (bankToIfscPrefix[normalized]) {
    return bankToIfscPrefix[normalized];
  }

  // Common variations without "ltd", "limited", "bank"
  const stripped = normalized
    .replace(/\b(ltd|limited|bank|the)\b/g, '')
    .trim()
    .replace(/\s+/g, ' ');

  if (stripped && bankToIfscPrefix[stripped]) {
    return bankToIfscPrefix[stripped];
  }

  // Partial / prefix match fallback
  for (const [key, prefix] of Object.entries(bankToIfscPrefix)) {
    if (normalized === key || normalized.startsWith(key) || key.startsWith(normalized)) {
      return prefix;
    }
  }

  // 3. If neither provides a usable prefix, do not guess
  return null;
};
