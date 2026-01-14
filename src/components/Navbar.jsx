import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <h1>Steam Aspect Based Sentiment Analyzer</h1>
        </div>
        <ul className="navbar-menu">
          <li>
            <Link to="/" className={location.pathname === "/" ? "active" : ""}>
              Game List
            </Link>
          </li>
          <li>
            <Link
              to="/analysis"
              className={location.pathname === "/analysis" ? "active" : ""}
            >
              Analysis Results
            </Link>
          </li>
          <li>
            <Link
              to="/system-info"
              className={location.pathname === "/system-info" ? "active" : ""}
            >
              System Info
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
