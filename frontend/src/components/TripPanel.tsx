type TripPanelProps = {
  tripName: string;
  setTripName: (value: string) => void;
};

export function TripPanel(props: TripPanelProps) {
  const { tripName, setTripName } = props;

  return (
    <section className="panel">
      <h2>Trip</h2>
      <input className="primary-field" value={tripName} onChange={(e) => setTripName(e.target.value)} placeholder="Trip name" />
    </section>
  );
}
