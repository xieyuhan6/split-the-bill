import { useEffect } from "react";

import type { Language } from "../i18n";
import { getSplitBillCopy } from "../i18n";
import type { CalculateResponse } from "../types";
import type { RateMode } from "../types";

type SummaryPanelProps = {
  language: Language;
  targetCurrency: string;
  setTargetCurrency: (value: string) => void;
  currencyOptions: string[];
  calculateSummary: () => void;
  onPrintSummary: () => void;
  usedCurrencies: string[];
  rateMap: Record<string, string>;
  setRateMap: (updater: (prev: Record<string, string>) => Record<string, string>) => void;
  rateMode: RateMode;
  setRateMode: (value: RateMode) => void;
  refreshLiveRates: () => Promise<void>;
  liveRatesLoading: boolean;
  liveRatesUpdatedAt: string;
  liveRatesBase: string;
  result: CalculateResponse | null;
  tripName: string;
};

export function SummaryPanel(props: SummaryPanelProps) {
  const {
    language,
    targetCurrency,
    setTargetCurrency,
    currencyOptions,
    calculateSummary,
    onPrintSummary,
    usedCurrencies,
    rateMap,
    setRateMap,
    rateMode,
    setRateMode,
    refreshLiveRates,
    liveRatesLoading,
    liveRatesUpdatedAt,
    liveRatesBase,
    result,
    tripName,
  } = props;
  const copy = getSplitBillCopy(language);

  useEffect(() => {
    if (rateMode === "realtime") {
      void refreshLiveRates();
    }
  }, [rateMode, refreshLiveRates, targetCurrency, usedCurrencies.join("|")]);

  const liveRateRows = usedCurrencies
    .filter((curr) => curr !== targetCurrency)
    .map((curr) => ({
      currency: curr,
      rate: rateMap[curr] ?? "—",
    }));

  return (
    <section className="panel summary-panel">
      <div className="summary-header-row">
        <div>
          <h2>{copy.summary.title}</h2>
          <p className="muted">{copy.summary.tripLabel}: {tripName}</p>
        </div>
        <div className="row wrap">
          <select className="currency primary-field" value={targetCurrency} onChange={(e) => setTargetCurrency(e.target.value)}>
            {currencyOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <button className="primary-button" onClick={calculateSummary}>{copy.summary.calculateButton}</button>
          <button className="secondary-button" onClick={onPrintSummary}>{copy.summary.printButton}</button>
        </div>
      </div>

      <div className="row wrap settlement-controls">
        <label>
          <span>{copy.summary.rateMode}</span>
          <select className="secondary-field" value={rateMode} onChange={(e) => setRateMode(e.target.value as RateMode)}>
            <option value="manual">{copy.summary.manualRates}</option>
            <option value="realtime">{copy.summary.liveRates}</option>
          </select>
        </label>
      </div>

      {rateMode === "manual" && (
        <div className="rate-grid">
          {usedCurrencies.filter((curr) => curr !== targetCurrency).map((curr) => (
            <label key={curr} className="rate-item">
              <span>{curr} -&gt; {targetCurrency}</span>
              <input
                value={rateMap[curr] ?? ""}
                onChange={(e) => setRateMap((prev) => ({ ...prev, [curr]: e.target.value }))}
              />
            </label>
          ))}
          {usedCurrencies.filter((curr) => curr !== targetCurrency).length === 0 && (
            <p className="muted">{copy.summary.sameCurrencyManual}</p>
          )}
        </div>
      )}

      {rateMode === "realtime" && (
        <div className="live-rate-summary">
          <div className="muted">
            {liveRatesLoading ? (
              <span>{copy.summary.loadingLiveRates}</span>
            ) : (
              <span>
                {copy.summary.liveRatesLoaded} {liveRatesBase || "EUR"}{liveRatesUpdatedAt ? ` ${language === "zh" ? "于" : "at"} ${liveRatesUpdatedAt}` : ""}.
              </span>
            )}
          </div>
          {!liveRatesLoading && (
            <div className="live-rate-list">
              {liveRateRows.map((item) => (
                <div key={item.currency} className="live-rate-row">
                  <span>{item.currency} -&gt; {targetCurrency}</span>
                  <strong>{item.rate}</strong>
                </div>
              ))}
              {liveRateRows.length === 0 && (
                <div className="muted">{copy.summary.sameCurrencyLive}</div>
              )}
            </div>
          )}
        </div>
      )}

      {result ? (
        <div className="summary-print-area">
          <div className="print-meta">
            <div><strong>{copy.summary.trip}:</strong> {tripName}</div>
            <div><strong>{copy.summary.generated}:</strong> {new Date().toLocaleString()}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>{copy.summary.person}</th>
                <th>{copy.summary.paid}</th>
                <th>{copy.summary.owed}</th>
                <th>{copy.summary.net}</th>
              </tr>
            </thead>
            <tbody>
              {result.people.map((person) => (
                <tr key={person.person_id}>
                  <td>{person.name}</td>
                  <td>{person.paid} {result.target_currency}</td>
                  <td>{person.owed} {result.target_currency}</td>
                  <td className={Number(person.net) >= 0 ? "positive" : "negative"}>{person.net} {result.target_currency}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>{copy.summary.transfers}</h3>
          <ul className="list">
            {result.transfers.map((t, idx) => (
              <li key={idx}>{t.from_name} -&gt; {t.to_name}: {t.amount} {t.currency}</li>
            ))}
            {result.transfers.length === 0 && <li className="muted">{copy.summary.noTransfers}</li>}
          </ul>

          <h3>{copy.summary.expenseDetails}</h3>
          <ul className="list">
            {result.expense_details.map((detail, idx) => {
              return (
                <li key={idx}>
                  <strong>{detail.title_and_amount}</strong>
                  <div className="expense-subline">{detail.total_line}</div>
                  <div className="expense-subline">{detail.adjustment_line}</div>
                  <div className="expense-subline">{copy.summary.calculationLabel}: {detail.process_line}</div>
                  <div className="expense-subline">{copy.summary.sharedPoolLabel}: {detail.participants_breakdown}</div>
                  <div className="expense-subline">{copy.summary.finalSettlementLabel}:</div>
                  {detail.final_lines.map((line, lineIdx) => (
                    <div key={lineIdx} className="expense-subline">{line}</div>
                  ))}
                </li>
              );
            })}
            {result.expense_details.length === 0 && <li className="muted">{copy.summary.noExpenseDetails}</li>}
          </ul>
        </div>
      ) : (
        <p className="muted">{copy.summary.addData}</p>
      )}
    </section>
  );
}
