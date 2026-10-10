import {
  ParsedHeadMatch,
  ParseResult,
  FiscalMonth,
  FISCAL_MONTHS,
} from '../types/reconciliation';
import { MASTER_SCHEDULE_ROWS } from '../data/budgetConfig';

// Keyword rules for matching descriptions if object code is not explicitly present
interface KeywordRule {
  rowNumber: number;
  codePattern: RegExp;
  keywords: string[];
}

const PARSER_RULES: KeywordRule[] = [
  {
    rowNumber: 1,
    codePattern: /\b(A-?01101|01101)\b/i,
    keywords: ['officer', 'officers', 'presiding officer', 'pay of officer', 'basic pay officer'],
  },
  {
    rowNumber: 2,
    codePattern: /\b(A-?01150|01150)\b/i,
    keywords: ['personal staff', 'pa to presiding officer', 'steno', 'stenographer', 'personal assistant'],
  },
  {
    rowNumber: 3,
    codePattern: /\b(A-?01151|01151)\b/i,
    keywords: ['other staff', 'staff pay', 'ministerial', 'peon', 'reader', 'clerk', 'class iv', 'class-iv', 'naib qasid'],
  },
  {
    rowNumber: 5,
    codePattern: /\b(A-?01201|01201|A-?012-?1)\b/i,
    keywords: ['allowances officer', 'officer allowance', 'judicial allowance', 'special allowance officer'],
  },
  {
    rowNumber: 6,
    codePattern: /\b(A-?01202|01202|A-?012-?2)\b/i,
    keywords: ['allowances staff', 'staff allowance', 'conveyance allowance', 'adhoc relief staff', 'house rent staff'],
  },
  {
    rowNumber: 8,
    codePattern: /\b(A-?012\b|01200|A-?01270)\b/i,
    keywords: ['total allowance', 'regular allowance', 'allowances total', 'adhoc relief', 'all allowances'],
  },
  {
    rowNumber: 10,
    codePattern: /\b(A-?032\b|A-?03201|A-?03202|03201|03202)\b/i,
    keywords: ['communication', 'postage', 'telephone', 'ptcl', 'courier', 'trunk call', 'internet charges'],
  },
  {
    rowNumber: 11,
    codePattern: /\b(A-?033\b|A-?03301|A-?03303|03301|03303)\b/i,
    keywords: ['utility', 'utilities', 'gas bill', 'electricity bill', 'pesco', 'sngpl', 'gas charges', 'electric'],
  },
  {
    rowNumber: 12,
    codePattern: /\b(A-?036\b|A-?03603|03603)\b/i,
    keywords: ['motor vehicle', 'registration', 'token tax vehicle', 'registration charges', 'excise vehicle'],
  },
  {
    rowNumber: 13,
    codePattern: /\b(A-?038\b|A-?03805|A-?03807|A-?03808|03805|03807|03808)\b/i,
    keywords: ['travel', 'transportation', 'ta/da', 't.a', 'pol', 'petrol', 'fuel', 'diesel', 'oil', 'conveyance charges'],
  },
  {
    rowNumber: 14,
    codePattern: /\b(A-?039\b|A-?03901|A-?03902|A-?03905|A-?03906|A-?03970)\b/i,
    keywords: ['general', 'stationery', 'printing', 'books', 'newspaper', 'uniform', 'liveries', 'others', 'misc'],
  },
  {
    rowNumber: 15,
    codePattern: /\b(A-?04\b|A-?04102|04102)\b/i,
    keywords: ['superannuation', 'l.p.r', 'lpr', 'encashment of lpr', 'leave encashment', 'retirement encashment'],
  },
  {
    rowNumber: 16,
    codePattern: /\b(A-?05\b|A-?05216|05216)\b/i,
    keywords: ['financial assistance', 'deceased family', 'assistance to families', 'death grant', 'family assistance'],
  },
  {
    rowNumber: 18,
    codePattern: /\b(A-?09201|09201)\b/i,
    keywords: ['hardware', 'computer', 'laptop', 'printer purchase', 'scanner purchase', 'desktop pc', 'it equipment'],
  },
  {
    rowNumber: 19,
    codePattern: /\b(A-?09601|09601)\b/i,
    keywords: ['machinery', 'machinery & equipment', 'generator purchase', 'photocopier purchase', 'ups purchase', 'ac purchase'],
  },
  {
    rowNumber: 20,
    codePattern: /\b(A-?09701|09701)\b/i,
    keywords: ['furniture', 'fixture', 'chair', 'desk', 'bench purchase', 'wooden furniture'],
  },
  {
    rowNumber: 22,
    codePattern: /\b(A-?13001|13001)\b/i,
    keywords: ['repair transport', 'repair vehicle', 'vehicle maintenance', 'car repair', 'tyres', 'inspection vehicle repair'],
  },
  {
    rowNumber: 23,
    codePattern: /\b(A-?13101|13101)\b/i,
    keywords: ['repair machinery', 'generator repair', 'photocopier service', 'ups repair', 'equipment repair', 'ac repair'],
  },
  {
    rowNumber: 24,
    codePattern: /\b(A-?13201|13201)\b/i,
    keywords: ['repair furniture', 'furniture repair', 'polishing furniture', 'chair repair', 'bench repair'],
  },
  {
    rowNumber: 25,
    codePattern: /\b(A-?13701|13701)\b/i,
    keywords: ['repair hardware', 'computer repair', 'printer servicing', 'hardware maintenance', 'cartridge'],
  },
];

// Clean Pakistani Rupee / accounting numbers like "Rs. 1,450,000/-" or "449,900.00" or "45000-"
export function extractNumbersFromLine(line: string): number[] {
  // Replace currency notations
  const sanitized = line.replace(/Rs\.?/gi, '').replace(/\/[-=]/g, '');
  // Matches positive integers or decimals with optional commas
  const regex = /[-+]?\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\b|\b\d+(?:\.\d+)?\b/g;
  const matches = sanitized.match(regex);
  if (!matches) return [];

  return matches
    .map((m) => {
      const clean = m.replace(/,/g, '');
      const num = parseFloat(clean);
      return isNaN(num) ? null : num;
    })
    .filter((n): n is number => n !== null && n >= 0);
}

// Detect which month this bill or schedule belongs to
export function detectMonth(text: string): FiscalMonth | undefined {
  for (const m of FISCAL_MONTHS) {
    const reg = new RegExp(`\\b${m}\\b`, 'i');
    if (reg.test(text)) return m;
  }
  return undefined;
}

// Main parser function
export function parsePifraScheduleText(rawText: string): ParseResult {
  const lines = rawText.split('\n');
  const matchedMap = new Map<number, ParsedHeadMatch>();
  const unmatchedLines: string[] = [];
  const detectedMonth = detectMonth(rawText);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('---') || trimmed.startsWith('===')) {
      continue;
    }

    // Skip general headers that contain court names but no figures
    if (
      trimmed.toLowerCase().includes('labour court') &&
      !trimmed.match(/\d{3,}/)
    ) {
      continue;
    }

    let matchedRule: KeywordRule | null = null;
    let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';

    // 1. Try matching by exact Object Code regex
    for (const rule of PARSER_RULES) {
      if (rule.codePattern.test(trimmed)) {
        matchedRule = rule;
        confidence = 'HIGH';
        break;
      }
    }

    // 2. If no code match, try keyword matching
    if (!matchedRule) {
      const lower = trimmed.toLowerCase();
      for (const rule of PARSER_RULES) {
        if (rule.keywords.some((kw) => lower.includes(kw))) {
          matchedRule = rule;
          confidence = 'MEDIUM';
          break;
        }
      }
    }

    if (matchedRule) {
      const def = MASTER_SCHEDULE_ROWS.find((r) => r.rowNumber === matchedRule!.rowNumber);
      if (!def) continue;

      const numbers = extractNumbersFromLine(trimmed);
      // In SAP / PIFRA schedules:
      // If multiple numbers appear (e.g. Code, Budget, Month Exp, Prog Exp):
      // Usually the current month amount is the first expenditure column, or second-to-last
      let amount = 0;
      if (numbers.length === 1) {
        amount = numbers[0];
      } else if (numbers.length >= 2) {
        // Exclude huge sanctioned budget numbers if they match exactly the budget
        const nonBudgetNumbers = numbers.filter((n) => n !== def.sanctionedBudget && n !== def.rowNumber);
        if (nonBudgetNumbers.length > 0) {
          // If 2 columns left (e.g. Month & Progressive), month is usually the first of the two
          amount = nonBudgetNumbers[0];
        } else {
          amount = numbers[numbers.length - 1];
        }
      }

      if (amount >= 0) {
        // If row was already matched, pick higher confidence or sum if multiple bills for same head
        const existing = matchedMap.get(matchedRule.rowNumber);
        if (!existing) {
          matchedMap.set(matchedRule.rowNumber, {
            rowNumber: matchedRule.rowNumber,
            objectCode: def.objectCode,
            description: def.description,
            detectedAmount: amount,
            rawTextSnippet: trimmed,
            confidence,
          });
        } else {
          // Add to existing detected amount (e.g. multiple POL vouchers)
          matchedMap.set(matchedRule.rowNumber, {
            ...existing,
            detectedAmount: existing.detectedAmount + amount,
            rawTextSnippet: `${existing.rawTextSnippet} | ${trimmed}`,
            confidence: existing.confidence === 'HIGH' ? 'HIGH' : confidence,
          });
        }
      }
    } else {
      // If line contains figures but wasn't matched
      const nums = extractNumbersFromLine(trimmed);
      if (nums.length > 0 && !trimmed.toLowerCase().includes('total') && !trimmed.toLowerCase().includes('grant')) {
        unmatchedLines.push(trimmed);
      }
    }
  }

  const matches = Array.from(matchedMap.values()).sort((a, b) => a.rowNumber - b.rowNumber);
  const totalParsedAmount = matches.reduce((sum, m) => sum + m.detectedAmount, 0);

  return {
    success: matches.length > 0,
    matchedCount: matches.length,
    totalParsedAmount,
    matches,
    unmatchedLines: unmatchedLines.slice(0, 10), // keep top 10
    suggestedMonth: detectedMonth,
  };
}

// Sample test dumps for user demonstration
export const SAMPLE_PIFRA_DUMPS = {
  octoberSAP: `GOVERNMENT OF KHYBER PAKHTUNKHWA
DISTRICT ACCOUNTS OFFICE, HARIPUR
PIFRA / SAP R/3 EXPENDITURE SCHEDULE FOR OCTOBER 2026
DDO: HR-4007 LABOUR COURT HARIPUR | GRANT: 21037 (030)

Object Code    Description                     Month Actual (Rs.)
A01101         Pay of Officers                 449,900
A01150         Pay of Personal Staff           3,800
A01151         Pay of Other Staff              419,500
A012-1         Regular Allowances - Officers   618,300
A012-2         Regular Allowances - Staff      554,300
A03202         Telephone & Communication       10,500
A03301         Gas & Utility Charges           150
A03807         POL & Travel Charges            175,000
A03901         Stationery & General Office     42,000
A09601         Machinery & Equipment           120,000
A13001         Repair of Transport / Vehicle   14,500
A13101         Repair of Machinery             3,500
A13201         Repair of Furniture             4,000
------------------------------------------------------------------`,

  monthlyBillsText: `Monthly Court Expenditure Statement - October 2026
DDO Code: HR-4007 Labour Court Haripur

1. Monthly Officer Pay: Rs. 449,900
2. Personal Staff Pay: Rs. 3,800
3. Other Staff Pay: Rs. 419,500
4. Allowances Officers: Rs. 618,300
5. Allowances Staff: Rs. 554,300
6. Telephone PTCL Bill: Rs. 10,500
7. Gas Charges: Rs. 150
8. PSO Fuel & POL Vouchers: Rs. 195,000
9. General Stationery & Court Register Printing: Rs. 42,000
10. Photocopier & Generator Purchase / Machinery: Rs. 120,000
11. Official Vehicle Tyre & Engine Repair: Rs. 14,500
12. Photocopier Servicing (Machinery Repair): Rs. 3,500
13. Court Benches Repair: Rs. 4,000`,

  julyTrialBalance: `PIFRA SAP ECC-6 TRIAL BALANCE - JULY 2026
GRANT 21037 (030) | COST CENTER HR-4007
A01101 PAY OF OFFICERS: 449900.00
A01150 PAY OF PERSONAL STAFF: 3800.00
A01151 PAY OF OTHER STAFF: 419500.00
A012-1 ALLOWANCES OFFICERS: 618300.00
A012-2 ALLOWANCES STAFF: 554300.00
A03201 POSTAGE & TELEPHONE: 11500.00
A03807 POL CHARGES: 155000.00
A03901 STATIONERY: 32000.00
A13001 REPAIR TRANSPORT: 12000.00
A13101 REPAIR MACHINERY: 4500.00`,
};
