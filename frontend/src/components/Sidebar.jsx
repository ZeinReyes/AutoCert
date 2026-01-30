import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import "./styles.css";

export default function Sidebar() {
  const [darkTheme, setDarkTheme] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDarkTheme(savedTheme === "dark" || (!savedTheme && systemPrefersDark));
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark-theme", darkTheme);
    localStorage.setItem("theme", darkTheme ? "dark" : "light");
  }, [darkTheme]);

  return (
    <aside
      className="col-12 col-md-3 col-lg-2 d-flex flex-column p-3 border-end"
      style={{
        backgroundColor: "var(--bg-sidebar)",
        borderColor: "var(--border-color)"
      }}
    >
      <h4 className="text-center mb-4">AutoCert</h4>

      <ul className="nav nav-pills flex-column gap-2 mb-auto text-center">
        <li className="nav-item">
          <NavLink
            to="/create-template"
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : "text-reset"}`
            }
            style={({ isActive }) =>
              isActive ? { backgroundColor: "var(--hover-bg)" } : undefined
            }
          >
            Create Template
          </NavLink>
        </li>

        <li className="nav-item">
          <NavLink
            to="/generate-certificate"
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : "text-reset"}`
            }
            style={({ isActive }) =>
              isActive ? { backgroundColor: "var(--hover-bg)" } : undefined
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
  );
}