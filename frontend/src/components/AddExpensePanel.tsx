import type { DraftAdjustment, Person } from "../types";

type AddExpensePanelProps = {
  aiExpensePrompt: string;
  setAiExpensePrompt: (value: string) => void;
  applyAiExpensePrompt: () => void;
  title: string;
  setTitle: (value: string) => void;
  amount: string;
  setAmount: (value: string) => void;
  currency: string;
  setCurrency: (value: string) => void;
  spentAt: string;
  setSpentAt: (value: string) => void;
  payerId: string;
  setPayerId: (value: string) => void;
  participantIds: number[];
  toggleParticipant: (personId: number) => void;
  addExpense: () => void;
  people: Person[];
  currencyOptions: string[];
  adjustments: DraftAdjustment[];
  addAdjustment: () => void;
  updateAdjustment: (index: number, patch: Partial<DraftAdjustment>) => void;
  removeAdjustment: (index: number) => void;
};

export function AddExpensePanel(props: AddExpensePanelProps) {
  const {
    aiExpensePrompt,
    setAiExpensePrompt,
    applyAiExpensePrompt,
    title,
    setTitle,
    amount,
    setAmount,
    currency,
    setCurrency,
    spentAt,
    setSpentAt,
    payerId,
    setPayerId,
    participantIds,
    toggleParticipant,
    addExpense,
    people,
    currencyOptions,
    adjustments,
    addAdjustment,
    updateAdjustment,
    removeAdjustment,
  } = props;

  return (
    <section className="panel">
      <h2>Add Expense</h2>
      <div className="ai-helper">
        <label>AI autofill</label>
        <textarea
          className="ai-helper-textarea"
          value={aiExpensePrompt}
          onChange={(e) => setAiExpensePrompt(e.target.value)}
          placeholder="Example: I paid 240 HKD first, split among 4 people, A skipped dinner and should pay 30 less"
          rows={3}
        />
        <div className="row wrap ai-helper-actions">
          <button type="button" className="primary-button" onClick={applyAiExpensePrompt}>AI Autofill</button>
          <button type="button" className="secondary-button" onClick={() => setAiExpensePrompt("")}>Clear</button>
          <span className="muted ai-helper-note">Local parsing, no token usage</span>
        </div>
      </div>
      <div className="row wrap">
        <input className="primary-field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
        <input className="primary-field amount-field" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" />
        <select className="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
          {currencyOptions.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      <div className="row wrap">
        <input className="secondary-field" type="datetime-local" value={spentAt} onChange={(e) => setSpentAt(e.target.value)} />
      </div>
      <div className="row wrap">
        <select className="primary-field" value={payerId} onChange={(e) => setPayerId(e.target.value)}>
          <option value="">Choose payer</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>{person.name}</option>
          ))}
        </select>
        <button className="primary-button" onClick={addExpense}>Add Expense</button>
      </div>

      <label className="participants-label">Participants</label>
      <div className="participants-grid">
        {people.map((person) => (
          <label key={person.id} className={participantIds.includes(person.id) ? "participant-card active" : "participant-card"}>
            <input
              type="checkbox"
              checked={participantIds.includes(person.id)}
              onChange={() => toggleParticipant(person.id)}
            />
            <span>{person.name}</span>
          </label>
        ))}
      </div>

      <div className="row wrap adjustments-head">
        <label>Adjustments</label>
        <button type="button" className="secondary-button" onClick={addAdjustment}>Add Adjustment</button>
      </div>
      {adjustments.map((adj, index) => (
        <div key={index} className="row wrap adjustment-row">
          <select className="secondary-field" value={adj.personId} onChange={(e) => updateAdjustment(index, { personId: e.target.value })}>
            {people.map((person) => (
              <option key={person.id} value={person.id}>{person.name}</option>
            ))}
          </select>
          <input
            className="adjustment-amount secondary-field"
            value={adj.deltaAmount}
            onChange={(e) => updateAdjustment(index, { deltaAmount: e.target.value })}
            placeholder="+20 or -15"
          />
          <button type="button" className="danger" onClick={() => removeAdjustment(index)}>Remove</button>
        </div>
      ))}
    </section>
  );
}
