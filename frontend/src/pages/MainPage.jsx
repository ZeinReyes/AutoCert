import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

function MainPage() {
  return (
    <div className="container-fluid" style={{ height: '100vh', overflow: 'hidden' }}>
      <div className="row" style={{ height: '100%' }}>
        <Sidebar />
        <main className="col p-4 main-content" style={{ height: '100%', overflowY: 'auto', marginBottom: "10px" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainPage;
