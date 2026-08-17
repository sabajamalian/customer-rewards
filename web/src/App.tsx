import { NavLink, Route, Routes } from 'react-router-dom';
import { MemberDetailPage } from './pages/MemberDetailPage';
import { MembersPage } from './pages/MembersPage';
import { RewardsPage } from './pages/RewardsPage';
import { TiersPage } from './pages/TiersPage';

export function App() {
  return (
    <div className="app">
      <nav className="nav">
        <span className="brand">Customer Rewards</span>
        <NavLink to="/" end>
          Members
        </NavLink>
        <NavLink to="/rewards">Rewards</NavLink>
        <NavLink to="/tiers">Tiers</NavLink>
      </nav>

      <main className="content">
        <Routes>
          <Route path="/" element={<MembersPage />} />
          <Route path="/members/:id" element={<MemberDetailPage />} />
          <Route path="/rewards" element={<RewardsPage />} />
          <Route path="/tiers" element={<TiersPage />} />
        </Routes>
      </main>
    </div>
  );
}
