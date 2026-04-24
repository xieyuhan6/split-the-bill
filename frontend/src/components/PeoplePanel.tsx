import type { Language } from "../i18n";
import { getSplitBillCopy } from "../i18n";
import type { Person } from "../types";

type PeoplePanelProps = {
  language: Language;
  newPersonName: string;
  setNewPersonName: (value: string) => void;
  addPerson: () => void;
  people: Person[];
  removePerson: (personId: number) => void;
};

export function PeoplePanel(props: PeoplePanelProps) {
  const { language, newPersonName, setNewPersonName, addPerson, people, removePerson } = props;
  const copy = getSplitBillCopy(language);

  return (
    <section className="panel">
      <h2>{copy.people.title}</h2>
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
          placeholder={copy.people.placeholder}
        />
        <button className="primary-button" onClick={addPerson}>{copy.people.addButton}</button>
      </div>
      <ul className="list">
        {people.map((person) => (
          <li key={person.id} className="row-between">
            <span>{person.name}</span>
            <button className="danger secondary-button" onClick={() => removePerson(person.id)}>{copy.people.removeButton}</button>
          </li>
        ))}
        {people.length === 0 && <li className="muted">{copy.people.empty}</li>}
      </ul>
    </section>
  );
}
