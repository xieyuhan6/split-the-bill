import { AddExpensePanel } from "./AddExpensePanel";
import { ExpenseDraftsPanel } from "./ExpenseDraftsPanel";
import { PeoplePanel } from "./PeoplePanel";
import { SummaryPanel } from "./SummaryPanel";
import { TripPanel } from "./TripPanel";
import { CURRENCY_OPTIONS } from "../constants";
import { getSplitBillCopy } from "../i18n";
import { useSplitBillPageModel } from "../hooks/useSplitBillPageModel";

type SplitBillPageProps = {
  model: ReturnType<typeof useSplitBillPageModel>;
};

export function SplitBillPage(props: SplitBillPageProps) {
  const { model } = props;
  const copy = getSplitBillCopy(model.language);

  return (
    <div className="page">
      <header className="hero">
        <div className="hero-topbar">
          <div>
            <p className="kicker">{copy.hero.kicker}</p>
            <h1>{copy.hero.title}</h1>
            <p className="subtitle">{copy.hero.subtitle}</p>
          </div>
          <button className="secondary-button language-toggle" type="button" onClick={model.toggleLanguage}>
            {copy.toggleLabel}
          </button>
        </div>
      </header>

      <main className="app-shell">
        <aside className="left-column">
          <TripPanel language={model.language} tripName={model.tripName} setTripName={model.setTripName} />

          <PeoplePanel
            language={model.language}
            newPersonName={model.newPersonName}
            setNewPersonName={model.setNewPersonName}
            addPerson={model.addPerson}
            people={model.people}
            removePerson={model.removePerson}
          />

          <AddExpensePanel
            language={model.language}
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
            language={model.language}
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
            language={model.language}
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
