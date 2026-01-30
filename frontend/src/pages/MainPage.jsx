import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

function MainPage() {
  return (
    <div className="container-fluid" style={{ height: '100vh', overflow: 'hidden' }}>
      <div className="row" style={{ height: '100%' }}>
        <Sidebar />
        <main className="col p-4" style={{ height: '100%', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainPage