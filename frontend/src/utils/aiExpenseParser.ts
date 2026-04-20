import type { DraftAdjustment, Person } from "../types";

export type AiExpenseParseResult = {
  title?: string;
  amount?: string;
  currency?: string;
  payerId?: string;
  participantIds?: number[];
  adjustments?: DraftAdjustment[];
};

const CURRENCY_PATTERNS: Array<{ pattern: RegExp; currency: string }> = [
  { pattern: /港币|港元|HKD|HK\$/i, currency: "HKD" },
  { pattern: /美元|美金|USD|\$/i, currency: "USD" },
  { pattern: /人民币|RMB|CNY|元|¥|￥/i, currency: "CNY" },
  { pattern: /日元|JPY|日币/i, currency: "JPY" },
  { pattern: /欧元|EUR/i, currency: "EUR" },
  { pattern: /英镑|GBP/i, currency: "GBP" },
  { pattern: /台币|TWD|NTD/i, currency: "TWD" },
  { pattern: /新币|SGD/i, currency: "SGD" },
  { pattern: /澳币|AUD/i, currency: "AUD" },
  { pattern: /加币|CAD/i, currency: "CAD" },
];

const TITLE_PATTERNS: Array<{ pattern: RegExp; title: string }> = [
  { pattern: /晚餐|夜宵/i, title: "Dinner" },
  { pattern: /午餐|中餐/i, title: "Lunch" },
  { pattern: /早餐/i, title: "Breakfast" },
  { pattern: /酒店|住宿|民宿/i, title: "Accommodation" },
  { pattern: /机票|航班|飞机/i, title: "Flight" },
  { pattern: /车费|打车|出租|uber|taxi|地铁|公交/i, title: "Transport" },
  { pattern: /门票|票/i, title: "Tickets" },
  { pattern: /房租/i, title: "Rent" },
  { pattern: /水电|煤气|网费/i, title: "Utilities" },
];

const PAYER_VERBS = "(?:先垫了|垫了|付了|出了|买了|结了账|结账|代付|报销|支付了)";
const FLAT_SPLIT_PATTERNS = /平摊|均摊|AA|平分|按人头/i;
const POSITIVE_ADJUSTMENT = /(?:多付|多出|补|加|追加|多摊)/i;
const NEGATIVE_ADJUSTMENT = /(?:少付|少出|少摊|少算|减|扣|少给)/i;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findCurrency(prompt: string, fallbackCurrency: string) {
  for (const item of CURRENCY_PATTERNS) {
    if (item.pattern.test(prompt)) {
      return item.currency;
    }
  }
  return fallbackCurrency;
}

function findAmount(prompt: string) {
  const paired = prompt.match(/(\d+(?:\.\d+)?)\s*(港币|港元|HKD|HK\$|美元|美金|USD|人民币|RMB|CNY|日元|JPY|欧元|EUR|英镑|GBP|台币|TWD|新币|SGD|澳币|AUD|加币|CAD|元|¥|￥)/i);
  if (paired) {
    return paired[1];
  }

  const firstNumber = prompt.match(/\d+(?:\.\d+)?/);
  return firstNumber?.[0] ?? "";
}

function findTitle(prompt: string) {
  for (const item of TITLE_PATTERNS) {
    if (item.pattern.test(prompt)) {
      return item.title;
    }
  }
  return "Trip expense";
}

function findMentionedPeople(prompt: string, people: Person[]) {
  return people.filter((person) => prompt.toLocaleLowerCase().includes(person.name.trim().toLocaleLowerCase()));
}

function findPayerId(prompt: string, people: Person[], fallbackPayerId: string) {
  for (const person of people) {
    const name = escapeRegExp(person.name.trim());
    if (!name) continue;

    const payerRegex = new RegExp(`${name}.{0,12}${PAYER_VERBS}|${PAYER_VERBS}.{0,12}${name}`, "i");
    if (payerRegex.test(prompt)) {
      return String(person.id);
    }
  }

  if (/\b我\b|我先垫|我垫了|我付了|我出了/i.test(prompt)) {
    return fallbackPayerId;
  }

  return undefined;
}

function findParticipantIds(prompt: string, people: Person[]) {
  if (people.length === 0) {
    return [];
  }

  if (FLAT_SPLIT_PATTERNS.test(prompt)) {
    return people.map((person) => person.id);
  }

  const mentioned = findMentionedPeople(prompt, people);
  const countMatch = prompt.match(/(\d+)\s*个?人/);
  if (countMatch && Number(countMatch[1]) === people.length) {
    return people.map((person) => person.id);
  }

  if (mentioned.length > 0) {
    return mentioned.map((person) => person.id);
  }

  return [];
}

function findAdjustments(prompt: string, people: Person[]) {
  const adjustments: DraftAdjustment[] = [];

  for (const person of people) {
    const name = escapeRegExp(person.name.trim());
    if (!name) continue;

    const positiveRegex = new RegExp(`${name}.{0,20}?${POSITIVE_ADJUSTMENT.source}\s*([+-]?\d+(?:\.\d+)?)`, "i");
    const negativeRegex = new RegExp(`${name}.{0,20}?${NEGATIVE_ADJUSTMENT.source}\s*([+-]?\d+(?:\.\d+)?)`, "i");

    const positiveMatch = prompt.match(positiveRegex);
    if (positiveMatch) {
      adjustments.push({ personId: String(person.id), deltaAmount: String(Math.abs(Number(positiveMatch[1]))) });
      continue;
    }

    const negativeMatch = prompt.match(negativeRegex);
    if (negativeMatch) {
      adjustments.push({ personId: String(person.id), deltaAmount: String(-Math.abs(Number(negativeMatch[1]))) });
    }
  }

  return adjustments;
}

export function parseAiExpensePrompt(prompt: string, people: Person[], fallbackCurrency: string, fallbackPayerId: string): AiExpenseParseResult {
  const trimmed = prompt.trim();
  if (!trimmed) {
    return {};
  }

  const amount = findAmount(trimmed);
  if (!amount) {
    return {};
  }

  const currency = findCurrency(trimmed, fallbackCurrency);
  const payerId = findPayerId(trimmed, people, fallbackPayerId);
  const participantIds = findParticipantIds(trimmed, people);
  const adjustments = findAdjustments(trimmed, people);

  return {
    title: findTitle(trimmed),
    amount,
    currency,
    payerId,
    participantIds: participantIds.length > 0 ? participantIds : undefined,
    adjustments: adjustments.length > 0 ? adjustments : undefined,
  };
}