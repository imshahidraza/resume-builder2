import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        📄 ResumeBuilder
      </Link>
      <ul className="navbar-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/builder">Build Resume</Link></li>
        <li><Link to="/admin">Admin</Link></li>
      </ul>
    </nav>
  );
}

export default Navbar;