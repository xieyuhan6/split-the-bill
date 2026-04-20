import { useMemo } from "react";

import { useSplitBillStore } from "../store/useSplitBillStore";

export function useSplitBillPageModel() {
  const model = useSplitBillStore();

  const usedCurrencies = useMemo(() => {
    const set = new Set<string>([model.targetCurrency]);
    for (const expense of model.expenses) {
      set.add(expense.currency);
    }
    return Array.from(set);
  }, [model.expenses, model.targetCurrency]);

  return {
    ...model,
    usedCurrencies,
  };
}
