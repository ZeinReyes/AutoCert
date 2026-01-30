import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainPage from "./pages/MainPage";
import GenerateCertificate from "./pages/GenerateCertificate";
import 'bootstrap/dist/css/bootstrap.min.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />}>
          <Route index element={<Navigate to="generate-certificate" replace />} />
          <Route path="generate-certificate" element={<GenerateCertificate />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
