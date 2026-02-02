import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const [darkTheme, setDarkTheme] = useState(false);
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    const isDark =
      savedTheme === "dark" || (!savedTheme && systemPrefersDark);

    setDarkTheme(isDark);
    document.documentElement.setAttribute(
      "data-bs-theme",
      isDark ? "dark" : "light"
    );
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-bs-theme",
      darkTheme ? "dark" : "light"
    );
    localStorage.setItem("theme", darkTheme ? "dark" : "light");
  }, [darkTheme]);

  return (
    <>
      <div className="d-md-none d-flex align-items-center justify-content-between p-2 border-bottom bg-body sticky-top">
        <button
          className="btn btn-outline-secondary"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          ☰
        </button>

        <h5 className="mb-0 fw-bold">AutoCert</h5>
        <div style={{ width: 36 }} />
      </div>

      {open && isMobile && (
        <div
          className="w-100 h-100 bg-dark bg-opacity-50 d-md-none"
          style={{ zIndex: 1040 }}
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`
          bg-body border-end p-3
          d-flex flex-column
          ${open ? "d-flex" : "d-none"}
          d-md-flex
        `}
        style={{
          width: 230,
          minWidth: 230,
          height: "100vh",
          position: isMobile ? "fixed" : "relative",
          top: 0,
          left: 0,
          zIndex: isMobile ? 1050 : "auto",
        }}
      >
        <div className="d-flex align-items-center justify-content-between mb-4">
          <h4 className="mb-0 fw-bold ">AutoCert</h4>
          {isMobile && (
            <button
              className="btn btn-sm btn-outline-secondary d-md-none"
              onClick={() => setOpen(false)}
            >
              ✕
            </button>
          )}
        </div>

        <ul className="nav nav-pills flex-column gap-2 mb-auto">
          <li className="nav-item">
            <NavLink
              to="/generate-certificate"
              className={({ isActive }) =>
                isActive || window.location.pathname === "/"
                  ? "nav-link active"
                  : "nav-link text-reset"
              }
              onClick={() => setOpen(false)}
            >
              Generate Certificate
            </NavLink>
          </li>
        </ul>

        <button
          className="btn btn-outline-secondary mt-4 d-flex align-items-center justify-content-between"
          onClick={() => setDarkTheme((v) => !v)}
        >
          <span>{darkTheme ? "Light Mode" : "Dark Mode"}</span>
          <span>{darkTheme ? "🌞" : "🌙"}</span>
        </button>
      </aside>
    </>
  );
}
