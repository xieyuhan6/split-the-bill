import { SplitBillPage } from "./components/SplitBillPage";
import { useSplitBillPageModel } from "./hooks/useSplitBillPageModel";

function App() {
  const model = useSplitBillPageModel();
  return <SplitBillPage model={model} />;
}

export default App;
