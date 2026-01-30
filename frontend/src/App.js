import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainPage from "./pages/MainPage";
import CreateTemplate from "./pages/CreateTemplate";
import GenerateCertificate from "./pages/GenerateCertificate";
import 'bootstrap/dist/css/bootstrap.min.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />}>
          <Route index element={<Navigate to="create-template" />} />
          <Route path="create-template" element={<CreateTemplate />} />
          <Route path="generate-certificate" element={<GenerateCertificate />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
