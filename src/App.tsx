import { Routes, Route } from 'react-router-dom';
import { EditorPage } from './pages/editor';
import { TemplatesPage } from './pages/templates';

function App() {
  return (
    <Routes>
      <Route path="/" element={<EditorPage />} />
      <Route path="/templates/:graphName" element={<TemplatesPage />} />
    </Routes>
  );
}

export default App;
