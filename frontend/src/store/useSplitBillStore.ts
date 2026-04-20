import { create } from "zustand";

import type { CalculateResponse, DraftAdjustment, ExpenseDraft, Person, RateMode } from "../types";
import { parseAiExpensePrompt } from "../utils/aiExpenseParser";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

type SplitBillState = {
  tripName: string;
  people: Person[];
  newPersonName: string;

  title: string;
  amount: string;
  spentAt: string;
  currency: string;
  payerId: string;
  participantIds: number[];
  adjustments: DraftAdjustment[];
  aiExpensePrompt: string;

  expenses: ExpenseDraft[];
  nextExpenseId: number;

  targetCurrency: string;
  rateMap: Record<string, string>;
  rateMode: RateMode;
  liveRatesLoading: boolean;
  liveRatesUpdatedAt: string;
  liveRatesBase: string;

  result: CalculateResponse | null;
  error: string;

  setTripName: (value: string) => void;
  setNewPersonName: (value: string) => void;
  setTitle: (value: string) => void;
  setAmount: (value: string) => void;
  setSpentAt: (value: string) => void;
  setCurrency: (value: string) => void;
  setPayerId: (value: string) => void;
  setAiExpensePrompt: (value: string) => void;
  applyAiExpensePrompt: () => void;
  setTargetCurrency: (value: string) => void;
  setRateMap: (updater: (prev: Record<string, string>) => Record<string, string>) => void;
  setRateMode: (value: RateMode) => void;
  refreshLiveRates: () => Promise<void>;

  addPerson: () => void;
  removePerson: (personId: number) => void;
  toggleParticipant: (personId: number) => void;

  addAdjustment: () => void;
  updateAdjustment: (index: number, patch: Partial<DraftAdjustment>) => void;
  removeAdjustment: (index: number) => void;

  addExpense: () => void;
  removeExpense: (id: number) => void;

  calculateSummary: () => Promise<void>;
  onPrintSummary: () => void;
  getPersonName: (personId: number) => string;
};

async function loadRealtimeExchangeRates(targetCurrency: string, currencies: string[]) {
  const symbols = Array.from(new Set(currencies.filter((currency) => currency !== targetCurrency)));
  const url = new URL(`${API_BASE_URL}/rates/latest`, window.location.origin);
  url.searchParams.set("target_currency", targetCurrency);
  if (symbols.length > 0) {
    url.searchParams.set("symbols", symbols.join(","));
  }

  const response = await fetch(url.toString());
  const data = await response.json() as {
    rates?: Record<string, string>;
    error?: { detail?: string };
  };

  if (!response.ok) {
    throw new Error(data.error?.detail ?? `Failed to load realtime exchange rates (${response.status})`);
  }

  const rates = data.rates ?? {};
  const exchangeRates: Record<string, number> = {};
  for (const currency of currencies) {
    const rate = Number(rates[currency]);
    if (!Number.isFinite(rate)) {
      throw new Error(`Realtime rates do not include ${currency}`);
    }
    exchangeRates[currency] = rate;
  }

  return exchangeRates;
}

function getUsedCurrencies(targetCurrency: string, expenses: ExpenseDraft[]) {
  return Array.from(new Set<string>([targetCurrency, ...expenses.map((e) => e.currency)]));
}

export const useSplitBillStore = create<SplitBillState>((set, get) => ({
  tripName: "Spring Trip",
  people: [],
  newPersonName: "",

  title: "Dinner",
  amount: "100",
  spentAt: "",
  currency: "USD",
  payerId: "",
  participantIds: [],
  adjustments: [],
  aiExpensePrompt: "",

  expenses: [],
  nextExpenseId: 1,

  targetCurrency: "USD",
  rateMap: { USD: "1" },
  rateMode: "manual",
  liveRatesLoading: false,
  liveRatesUpdatedAt: "",
  liveRatesBase: "",

  result: null,
  error: "",

  setTripName: (value) => set({ tripName: value }),
  setNewPersonName: (value) => set({ newPersonName: value }),
  setTitle: (value) => set({ title: value }),
  setAmount: (value) => set({ amount: value }),
  setSpentAt: (value) => set({ spentAt: value }),
  setCurrency: (value) => set({ currency: value }),
  setPayerId: (value) => set({ payerId: value }),
  setAiExpensePrompt: (value) => set({ aiExpensePrompt: value }),
  applyAiExpensePrompt: () => {
    const state = get();
    const parsed = parseAiExpensePrompt(
      state.aiExpensePrompt,
      state.people,
      state.currency,
      state.payerId || (state.people[0] ? String(state.people[0].id) : "")
    );

    if (!parsed.amount) {
      set({ error: "Please enter a clear expense description with an amount." });
      return;
    }

    set({
      error: "",
      title: parsed.title ?? state.title,
      amount: parsed.amount,
      currency: parsed.currency ?? state.currency,
      payerId: parsed.payerId ?? state.payerId,
      participantIds: parsed.participantIds ?? state.participantIds,
      adjustments: parsed.adjustments ?? state.adjustments,
    });
  },
  setTargetCurrency: (value) => set({ targetCurrency: value }),
  setRateMap: (updater) => set((state) => ({ rateMap: updater(state.rateMap) })),
  setRateMode: (value) => set({ rateMode: value }),
  refreshLiveRates: async () => {
    const state = get();
    const usedCurrencies = getUsedCurrencies(state.targetCurrency, state.expenses);
    set({ liveRatesLoading: true, error: "" });
    try {
      const realtimeRates = await loadRealtimeExchangeRates(state.targetCurrency, usedCurrencies);
      set((current) => ({
        rateMap: {
          ...current.rateMap,
          ...Object.fromEntries(
            Object.entries(realtimeRates).map(([currency, value]) => [currency, String(value)])
          ),
        },
        liveRatesLoading: false,
        liveRatesUpdatedAt: new Date().toLocaleString(),
        liveRatesBase: state.targetCurrency,
      }));
    } catch (error) {
      set({
        liveRatesLoading: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },

  addPerson: () => {
    const state = get();
    const name = state.newPersonName.trim();
    if (!name) return;

    const normalized = name.toLocaleLowerCase();
    const existingNormalized = state.people.map((p) => p.name.trim().toLocaleLowerCase());

    let finalName = name;
    if (existingNormalized.includes(normalized)) {
      const shouldContinue = window.confirm(
        `${name} has already been added. Continue?\n\n` +
        `- Cancel: do not add\n` +
        `- OK: add as ${name} (1)`
      );
      if (!shouldContinue) {
        return;
      }

      let suffix = 1;
      let candidate = `${name} (${suffix})`;
      while (existingNormalized.includes(candidate.trim().toLocaleLowerCase())) {
        suffix += 1;
        candidate = `${name} (${suffix})`;
      }
      finalName = candidate;
    }

    const person: Person = {
      id: state.people.length === 0 ? 1 : Math.max(...state.people.map((p) => p.id)) + 1,
      name: finalName,
    };
    const nextPeople = [...state.people, person];

    set({
      people: nextPeople,
      newPersonName: "",
      payerId: !state.payerId ? String(person.id) : state.payerId,
      participantIds: state.participantIds.length === 0 ? nextPeople.map((p) => p.id) : state.participantIds,
    });
  },

  removePerson: (personId) => {
    const state = get();
    const nextPeople = state.people.filter((p) => p.id !== personId);

    set({
      people: nextPeople,
      participantIds: state.participantIds.filter((id) => id !== personId),
      adjustments: state.adjustments.filter((adj) => Number(adj.personId) !== personId),
      payerId: state.payerId && Number(state.payerId) === personId
        ? (nextPeople[0] ? String(nextPeople[0].id) : "")
        : state.payerId,
    });
  },

  toggleParticipant: (personId) => set((state) => ({
    participantIds: state.participantIds.includes(personId)
      ? state.participantIds.filter((id) => id !== personId)
      : [...state.participantIds, personId],
  })),

  addAdjustment: () => {
    const state = get();
    if (state.people.length === 0) return;
    set({ adjustments: [...state.adjustments, { personId: String(state.people[0].id), deltaAmount: "" }] });
  },

  updateAdjustment: (index, patch) => set((state) => ({
    adjustments: state.adjustments.map((a, i) => (i === index ? { ...a, ...patch } : a)),
  })),

  removeAdjustment: (index) => set((state) => ({
    adjustments: state.adjustments.filter((_, i) => i !== index),
  })),

  getPersonName: (personId) => get().people.find((p) => p.id === personId)?.name ?? "Unknown",

  addExpense: () => {
    const state = get();
    const parsedAmount = Number(state.amount);

    if (!state.title.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      set({ error: "Please enter a valid expense title and amount." });
      return;
    }
    if (!state.spentAt) {
      set({ error: "Please choose the expense time." });
      return;
    }
    if (!state.payerId) {
      set({ error: "Please choose a payer." });
      return;
    }
    if (state.participantIds.length === 0) {
      set({ error: "Please select at least one participant." });
      return;
    }

    const totalAbsAdjustment = state.adjustments.reduce((sum, adj) => {
      const val = Number(adj.deltaAmount);
      if (!Number.isFinite(val)) return sum;
      return sum + Math.abs(val);
    }, 0);
    if (totalAbsAdjustment > parsedAmount) {
      const msg = "Invalid adjustments: total absolute adjustment cannot exceed this expense amount.";
      set({ error: msg });
      window.alert(msg);
      return;
    }

    const item: ExpenseDraft = {
      id: state.nextExpenseId,
      title: state.title.trim(),
      amount: parsedAmount.toString(),
      currency: state.currency,
      spentAt: state.spentAt,
      payerId: state.payerId,
      participantIds: state.participantIds,
      adjustments: state.adjustments,
    };

    set({
      error: "",
      expenses: [item, ...state.expenses],
      nextExpenseId: state.nextExpenseId + 1,
      title: "Dinner",
      amount: "100",
      currency: "USD",
      spentAt: "",
      adjustments: [],
    });
  },

  removeExpense: (id) => set((state) => ({ expenses: state.expenses.filter((e) => e.id !== id) })),

  calculateSummary: async () => {
    set({ error: "" });
    const state = get();

    if (state.people.length === 0 || state.expenses.length === 0) {
      set({ error: "Add people and at least one expense before calculating." });
      return;
    }

    const usedCurrencies = getUsedCurrencies(state.targetCurrency, state.expenses);

    const exchangeRates: Record<string, number> = {};
    if (state.rateMode === "realtime") {
      try {
        const realtimeRates = await loadRealtimeExchangeRates(state.targetCurrency, usedCurrencies);
        for (const curr of usedCurrencies) {
          exchangeRates[curr] = realtimeRates[curr] ?? 1;
        }
        set((current) => ({
          rateMap: {
            ...current.rateMap,
            ...Object.fromEntries(
              Object.entries(exchangeRates).map(([currency, value]) => [currency, String(value)])
            ),
          },
        }));
      } catch (error) {
        set({ error: error instanceof Error ? error.message : String(error) });
        return;
      }
    } else {
      for (const curr of usedCurrencies) {
        if (curr === state.targetCurrency) {
          exchangeRates[curr] = 1;
          continue;
        }
        const parsed = Number(state.rateMap[curr] ?? "");
        if (!Number.isFinite(parsed) || parsed <= 0) {
          set({ error: `Please provide a valid positive rate for ${curr} -> ${state.targetCurrency}.` });
          return;
        }
        exchangeRates[curr] = parsed;
      }
    }

    const payload = {
      people: state.people.map((p) => ({ id: p.id, name: p.name })),
      expenses: state.expenses.map((e) => ({
        title: e.title,
        payer_id: Number(e.payerId),
        amount: Number(e.amount),
        currency: e.currency,
        participants: e.participantIds.map((id) => ({
          person_id: id,
          split_type: "equal",
          split_value: 1,
        })),
        adjustments: e.adjustments
          .map((a) => ({ person_id: Number(a.personId), delta_amount: Number(a.deltaAmount) }))
          .filter((a) => Number.isFinite(a.person_id) && Number.isFinite(a.delta_amount) && a.delta_amount !== 0),
      })),
      target_currency: state.targetCurrency,
      exchange_rates: exchangeRates,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      if (!response.ok) {
        try {
          const data = JSON.parse(text) as { detail?: string };
          throw new Error(data.detail ?? text);
        } catch {
          throw new Error(text || `Request failed (${response.status})`);
        }
      }

      set({ result: JSON.parse(text) as CalculateResponse });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  onPrintSummary: () => {
    window.print();
  },
}));
