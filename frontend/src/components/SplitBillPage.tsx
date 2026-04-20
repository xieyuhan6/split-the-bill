import { AddExpensePanel } from "./AddExpensePanel";
import { ExpenseDraftsPanel } from "./ExpenseDraftsPanel";
import { PeoplePanel } from "./PeoplePanel";
import { SummaryPanel } from "./SummaryPanel";
import { TripPanel } from "./TripPanel";
import { CURRENCY_OPTIONS } from "../constants";
import { useSplitBillPageModel } from "../hooks/useSplitBillPageModel";

type SplitBillPageProps = {
  model: ReturnType<typeof useSplitBillPageModel>;
};

export function SplitBillPage(props: SplitBillPageProps) {
  const { model } = props;

  return (
    <div className="page">
      <header className="hero">
        <p className="kicker">SplitBill</p>
        <h1>One-Time Trip Split Calculator</h1>
        <p className="subtitle">No database, no saved records. Enter, calculate, print.</p>
      </header>

      <main className="app-shell">
        <aside className="left-column">
          <TripPanel tripName={model.tripName} setTripName={model.setTripName} />

          <PeoplePanel
            newPersonName={model.newPersonName}
            setNewPersonName={model.setNewPersonName}
            addPerson={model.addPerson}
            people={model.people}
            removePerson={model.removePerson}
          />

          <AddExpensePanel
            aiExpensePrompt={model.aiExpensePrompt}
            setAiExpensePrompt={model.setAiExpensePrompt}
            applyAiExpensePrompt={model.applyAiExpensePrompt}
            title={model.title}
            setTitle={model.setTitle}
            amount={model.amount}
            setAmount={model.setAmount}
            currency={model.currency}
            setCurrency={model.setCurrency}
            spentAt={model.spentAt}
            setSpentAt={model.setSpentAt}
            payerId={model.payerId}
            setPayerId={model.setPayerId}
            participantIds={model.participantIds}
            toggleParticipant={model.toggleParticipant}
            addExpense={model.addExpense}
            people={model.people}
            currencyOptions={CURRENCY_OPTIONS}
            adjustments={model.adjustments}
            addAdjustment={model.addAdjustment}
            updateAdjustment={model.updateAdjustment}
            removeAdjustment={model.removeAdjustment}
          />
        </aside>

        <section className="right-column">
          <SummaryPanel
            targetCurrency={model.targetCurrency}
            setTargetCurrency={model.setTargetCurrency}
            currencyOptions={CURRENCY_OPTIONS}
            calculateSummary={model.calculateSummary}
            onPrintSummary={model.onPrintSummary}
            usedCurrencies={model.usedCurrencies}
            rateMap={model.rateMap}
            setRateMap={model.setRateMap}
            rateMode={model.rateMode}
            setRateMode={model.setRateMode}
            refreshLiveRates={model.refreshLiveRates}
            liveRatesLoading={model.liveRatesLoading}
            liveRatesUpdatedAt={model.liveRatesUpdatedAt}
            liveRatesBase={model.liveRatesBase}
            result={model.result}
            tripName={model.tripName}
          />

          <ExpenseDraftsPanel
            expenses={model.expenses}
            getPersonName={model.getPersonName}
            removeExpense={model.removeExpense}
          />
        </section>
      </main>

      {model.error && <div className="error">{model.error}</div>}
    </div>
  );
}
