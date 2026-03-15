import { ThemeProvider } from "./theme/theme-provider";
import { KenchiShell } from "./features/shell/kenchi-shell";
import "./app.css";

function App() {
  return (
    <ThemeProvider>
      <KenchiShell />
    </ThemeProvider>
  );
}

export default App;
