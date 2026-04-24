import type { Language } from "../i18n";
import { getSplitBillCopy } from "../i18n";
import type { ExpenseDraft } from "../types";

type ExpenseDraftsPanelProps = {
  language: Language;
  expenses: ExpenseDraft[];
  getPersonName: (personId: number) => string;
  removeExpense: (id: number) => void;
};

export function ExpenseDraftsPanel(props: ExpenseDraftsPanelProps) {
  const { language, expenses, getPersonName, removeExpense } = props;
  const copy = getSplitBillCopy(language);

  return (
    <section className="panel history-panel">
      <h2>{copy.drafts.title}</h2>
      <ul className="list">
        {expenses.map((expense) => {
          const payer = getPersonName(Number(expense.payerId));
          const participants = expense.participantIds.map((id) => getPersonName(id)).join(", ");
          return (
            <li key={expense.id} className="expense-item">
              <div className="expense-detail">
                <strong>{expense.title}: {expense.amount} {expense.currency}</strong>
                <div className="expense-subline">{copy.drafts.payer}: {payer}</div>
                <div className="expense-subline">{copy.drafts.participants}: {participants}</div>
              </div>
              <button className="danger" onClick={() => removeExpense(expense.id)}>{copy.drafts.deleteButton}</button>
            </li>
          );
        })}
        {expenses.length === 0 && <li className="muted">{copy.drafts.empty}</li>}
      </ul>
    </section>
  );
}
