import type { Language } from "../i18n";
import { getSplitBillCopy } from "../i18n";
import type { DraftAdjustment, Person } from "../types";

type AddExpensePanelProps = {
  language: Language;
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
    language,
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
  const copy = getSplitBillCopy(language);

  return (
    <section className="panel">
      <h2>{copy.expense.title}</h2>
      <div className="ai-helper">
        <label>{copy.expense.aiLabel}</label>
        <textarea
          className="ai-helper-textarea"
          value={aiExpensePrompt}
          onChange={(e) => setAiExpensePrompt(e.target.value)}
          placeholder={copy.expense.aiPlaceholder}
          rows={3}
        />
        <div className="row wrap ai-helper-actions">
          <button type="button" className="primary-button" onClick={applyAiExpensePrompt}>{copy.expense.aiButton}</button>
          <button type="button" className="secondary-button" onClick={() => setAiExpensePrompt("")}>{copy.expense.clearButton}</button>
          <span className="muted ai-helper-note">{copy.expense.aiNote}</span>
        </div>
      </div>
      <div className="row wrap">
        <input className="primary-field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={copy.expense.titlePlaceholder} />
        <input className="primary-field amount-field" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={copy.expense.amountPlaceholder} />
        <select className="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
          {currencyOptions.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      <div className="row wrap">
        <input className="secondary-field" type="datetime-local" value={spentAt} onChange={(e) => setSpentAt(e.target.value)} />
      </div>
      <div className="row wrap">
        <select className="primary-field" value={payerId} onChange={(e) => setPayerId(e.target.value)}>
          <option value="">{copy.expense.payerPlaceholder}</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>{person.name}</option>
          ))}
        </select>
        <button className="primary-button" onClick={addExpense}>{copy.expense.addExpenseButton}</button>
      </div>

      <label className="participants-label">{copy.expense.participants}</label>
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
        <label>{copy.expense.adjustments}</label>
        <button type="button" className="secondary-button" onClick={addAdjustment}>{copy.expense.addAdjustmentButton}</button>
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
          <button type="button" className="danger" onClick={() => removeAdjustment(index)}>{copy.expense.removeButton}</button>
        </div>
      ))}
    </section>
  );
}
