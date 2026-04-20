import { useEffect } from "react";

import type { CalculateResponse } from "../types";
import type { RateMode } from "../types";

type SummaryPanelProps = {
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
          <h2>Summary</h2>
          <p className="muted">Trip: {tripName}</p>
        </div>
        <div className="row wrap">
          <select className="currency primary-field" value={targetCurrency} onChange={(e) => setTargetCurrency(e.target.value)}>
            {currencyOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <button className="primary-button" onClick={calculateSummary}>Calculate</button>
          <button className="secondary-button" onClick={onPrintSummary}>Print</button>
        </div>
      </div>

      <div className="row wrap settlement-controls">
        <label>
          <span>Rate mode</span>
          <select className="secondary-field" value={rateMode} onChange={(e) => setRateMode(e.target.value as RateMode)}>
            <option value="manual">Manual rates</option>
            <option value="realtime">Live rates</option>
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
            <p className="muted">No exchange rates needed for same-currency expenses.</p>
          )}
        </div>
      )}

      {rateMode === "realtime" && (
        <div className="live-rate-summary">
          <div className="muted">
            {liveRatesLoading ? (
              <span>Loading live rates...</span>
            ) : (
              <span>
                Live rates loaded from {liveRatesBase || "EUR"}{liveRatesUpdatedAt ? ` at ${liveRatesUpdatedAt}` : ""}.
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
                <div className="muted">No live exchange rates needed for same-currency expenses.</div>
              )}
            </div>
          )}
        </div>
      )}

      {result ? (
        <div className="summary-print-area">
          <div className="print-meta">
            <div><strong>Trip:</strong> {tripName}</div>
            <div><strong>Generated:</strong> {new Date().toLocaleString()}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Person</th>
                <th>Paid</th>
                <th>Owed</th>
                <th>Net</th>
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

          <h3>Transfers</h3>
          <ul className="list">
            {result.transfers.map((t, idx) => (
              <li key={idx}>{t.from_name} -&gt; {t.to_name}: {t.amount} {t.currency}</li>
            ))}
            {result.transfers.length === 0 && <li className="muted">No transfers needed.</li>}
          </ul>

          <h3>Expense Details</h3>
          <ul className="list">
            {result.expense_details.map((detail, idx) => {
              return (
                <li key={idx}>
                  <strong>{detail.title_and_amount}</strong>
                  <div className="expense-subline">{detail.total_line}</div>
                  <div className="expense-subline">{detail.adjustment_line}</div>
                  <div className="expense-subline">Calculation: {detail.process_line}</div>
                  <div className="expense-subline">Shared pool split: {detail.participants_breakdown}</div>
                  <div className="expense-subline">Final settlement:</div>
                  {detail.final_lines.map((line, lineIdx) => (
                    <div key={lineIdx} className="expense-subline">{line}</div>
                  ))}
                </li>
              );
            })}
            {result.expense_details.length === 0 && <li className="muted">No expense details.</li>}
          </ul>
        </div>
      ) : (
        <p className="muted">Add data and click Calculate.</p>
      )}
    </section>
  );
}
