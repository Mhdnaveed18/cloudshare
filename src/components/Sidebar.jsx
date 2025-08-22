import { NavLink } from "react-router-dom";
import { HiOutlineHome, HiOutlineFolder, HiOutlineUsers, HiOutlineCog6Tooth, HiOutlineStar } from "react-icons/hi2";

const linkClasses = ({ isActive }) =>
  `group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-blue-400/10 hover:text-blue-300 ${
    isActive ? "bg-blue-400/10 text-blue-300" : "text-gray-300"
  }`;

export default function Sidebar() {
  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-[4.25rem] space-y-2">
        <NavLink to="/" end className={linkClasses}>
          <HiOutlineHome className="h-5 w-5" />
          Dashboard
        </NavLink>
        <NavLink to="/files" className={linkClasses}>
          <HiOutlineFolder className="h-5 w-5" />
          Files
        </NavLink>
        <NavLink to="/shared" className={linkClasses}>
          <HiOutlineUsers className="h-5 w-5" />
          Shared with me
        </NavLink>
        <NavLink to="/favorites" className={linkClasses}>
          <HiOutlineStar className="h-5 w-5" />
          Favorites
        </NavLink>
        <div className="pt-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1 mb-2">Settings</div>
          <NavLink to="/settings" className={linkClasses}>
            <HiOutlineCog6Tooth className="h-5 w-5" />
            Preferences
          </NavLink>
        </div>
      </div>
    </aside>
  );
}
