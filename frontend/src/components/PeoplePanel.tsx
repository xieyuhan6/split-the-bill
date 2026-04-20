import type { Person } from "../types";

type PeoplePanelProps = {
  newPersonName: string;
  setNewPersonName: (value: string) => void;
  addPerson: () => void;
  people: Person[];
  removePerson: (personId: number) => void;
};

export function PeoplePanel(props: PeoplePanelProps) {
  const { newPersonName, setNewPersonName, addPerson, people, removePerson } = props;

  return (
    <section className="panel">
      <h2>People</h2>
      <div className="row">
        <input
          className="primary-field"
          value={newPersonName}
          onChange={(e) => setNewPersonName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addPerson();
            }
          }}
          placeholder="Name"
        />
        <button className="primary-button" onClick={addPerson}>Add</button>
      </div>
      <ul className="list">
        {people.map((person) => (
          <li key={person.id} className="row-between">
            <span>{person.name}</span>
            <button className="danger secondary-button" onClick={() => removePerson(person.id)}>Remove</button>
          </li>
        ))}
        {people.length === 0 && <li className="muted">No people yet.</li>}
      </ul>
    </section>
  );
}
