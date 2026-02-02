import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const [darkTheme, setDarkTheme] = useState(false);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDarkTheme(savedTheme === "dark" || (!savedTheme && systemPrefersDark));
  }, []);

  useEffect(() => {
    // default collapsed on small screens
    const handleResize = () => setOpen(window.innerWidth >= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark-theme", darkTheme);
    localStorage.setItem("theme", darkTheme ? "dark" : "light");
  }, [darkTheme]);

  return (
    <>
      <div className="mobile-header d-md-none d-flex align-items-center justify-content-between p-2">
        <button
          className="btn btn-outline-secondary mobile-hamburger"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close sidebar" : "Open sidebar"}
        >
          {open ? "✕" : "☰"}
        </button>
        <h4 className="text-center mb-0 branding">AutoCert</h4>
        <div style={{ width: 36 }} />
      </div>

      <aside
        className={`col-12 col-md-3 col-lg-2 d-flex flex-column p-3 border-end sidebar ${open ? "" : "collapsed"}`}
      >
        <h4 className="text-center mb-4 branding d-none d-md-block">AutoCert</h4>

        <ul className="nav nav-pills flex-column gap-2 mb-auto text-center">
        <li className="nav-item">
          <NavLink
            to="/generate-certificate"
            className={({ isActive }) =>
              isActive || window.location.pathname === "/" ? "nav-link active" : "nav-link text-reset"
            }
          >
            Generate Certificate
          </NavLink>
        </li>
      </ul>

      <button
        className="btn btn-outline-secondary mt-4 d-flex align-items-center justify-content-between"
        onClick={() => setDarkTheme(!darkTheme)}
      >
        <span>{darkTheme ? "Light Mode" : "Dark Mode"}</span>
        <span className="ms-2">{darkTheme ? "🌞" : "🌙"}</span>
      </button>
    </aside>
    </>
  );
}
