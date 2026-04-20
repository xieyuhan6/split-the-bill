import type { ExpenseDraft } from "../types";

type ExpenseDraftsPanelProps = {
  expenses: ExpenseDraft[];
  getPersonName: (personId: number) => string;
  removeExpense: (id: number) => void;
};

export function ExpenseDraftsPanel(props: ExpenseDraftsPanelProps) {
  const { expenses, getPersonName, removeExpense } = props;

  return (
    <section className="panel history-panel">
      <h2>Expense Drafts</h2>
      <ul className="list">
        {expenses.map((expense) => {
          const payer = getPersonName(Number(expense.payerId));
          const participants = expense.participantIds.map((id) => getPersonName(id)).join(", ");
          return (
            <li key={expense.id} className="expense-item">
              <div className="expense-detail">
                <strong>{expense.title}: {expense.amount} {expense.currency}</strong>
                <div className="expense-subline">Payer: {payer}</div>
                <div className="expense-subline">Participants: {participants}</div>
              </div>
              <button className="danger" onClick={() => removeExpense(expense.id)}>Delete</button>
            </li>
          );
        })}
        {expenses.length === 0 && <li className="muted">No expense drafts yet.</li>}
      </ul>
    </section>
  );
}
