import { ThemeProvider } from "./theme/theme-provider";
import { LiraShell } from "./features/shell/lira-shell";
import "./app.css";

function App() {
  return (
    <ThemeProvider>
      <LiraShell />
    </ThemeProvider>
  );
}

export default App;
