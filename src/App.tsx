import { Routes, Route } from 'react-router-dom';
import { EditorPage } from './pages/editor';
import { RaisedBedPage } from './pages/templates/raisedBed';

function App() {
  return (
    <Routes>
      <Route path="/" element={<EditorPage />} />
      <Route path="/templates/raisedbed" element={<RaisedBedPage />} />
    </Routes>
  );
}

export default App;
