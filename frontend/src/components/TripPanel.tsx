import type { Language } from "../i18n";
import { getSplitBillCopy } from "../i18n";

type TripPanelProps = {
  language: Language;
  tripName: string;
  setTripName: (value: string) => void;
};

export function TripPanel(props: TripPanelProps) {
  const { language, tripName, setTripName } = props;
  const copy = getSplitBillCopy(language);

  return (
    <section className="panel">
      <h2>{copy.trip.title}</h2>
      <input className="primary-field" value={tripName} onChange={(e) => setTripName(e.target.value)} placeholder={copy.trip.placeholder} />
    </section>
  );
}
