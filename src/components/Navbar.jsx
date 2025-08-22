import { Link, NavLink, useNavigate } from "react-router-dom";
import { HiOutlineCloudArrowUp, HiOutlineMagnifyingGlass } from "react-icons/hi2";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/authSlice";

export default function Navbar() {
  const { isAuthenticated, user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  function onLogout() {
    dispatch(logout());
    navigate("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-800 bg-gray-900/80 backdrop-blur supports-[backdrop-filter]:bg-gray-900/60">
      <div className="mx-auto w-full max-w-none px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <Link to="/" className="group inline-flex items-center gap-2">
              <span className="relative grid h-9 w-9 place-items-center rounded-xl overflow-hidden">
                <span className="absolute inset-0 bg-gradient-to-br from-[--color-brand] to-[--color-brand-2]" />
                <HiOutlineCloudArrowUp className="relative z-10 h-5 w-5 text-white" />
              </span>
              <span className="text-xl font-extrabold tracking-tight text-gray-100">CloudShare</span>
            </Link>
          </div>

          {/* Search */}
          <div className="hidden md:flex flex-1 justify-center px-8">
            <form
              className="flex w-full max-w-2xl items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const q = String(formData.get("q") || "").trim();
                const source = String(formData.get("source") || "all");
                const params = new URLSearchParams();
                if (q) params.set("q", q);
                if (source && source !== "all") params.set("source", source);
                navigate(`/files${params.toString() ? `?${params.toString()}` : ""}`);
              }}
            >
              <div className="relative flex-1">
                <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  name="q"
                  type="search"
                  placeholder="Search files..."
                  className="w-full rounded-xl border border-gray-700 bg-gray-800/80 text-gray-200 placeholder:text-gray-400 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>
              <div className="relative">
                <label htmlFor="search-source" className="sr-only">Search scope</label>
                <select
                  id="search-source"
                  name="source"
                  defaultValue="all"
                  aria-label="Search scope"
                  className="appearance-none rounded-xl border border-gray-700 bg-gray-800/80 text-gray-200 text-sm pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 hover:bg-gray-800 transition"
                  title="Search scope"
                >
                  <option value="all">All</option>
                  <option value="favorites">Favorites</option>
                  <option value="shared-with-me">Shared with me</option>
                  <option value="shared-by-me">Shared by me</option>
                </select>
                <svg aria-hidden="true" viewBox="0 0 20 20" className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400">
                  <path fill="currentColor" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z"/>
                </svg>
              </div>
              <button type="submit" className="btn-gradient text-sm px-3 py-2">Search</button>
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Premium badge (if applicable) */}
                {user?.isPremium ? (
                  <span className="hidden sm:inline-flex items-center rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 px-2 py-0.5 text-xs font-semibold">Premium</span>
                ) : null}
                {/* Name/email (hidden on mobile) */}
                <span className="hidden sm:inline-flex items-center px-2 py-1 text-sm font-medium text-gray-300">
                  {user?.name || user?.email}
                </span>
                {/* Avatar (always visible) */}
                <Link to="/settings" className="relative h-8 w-8 rounded-full overflow-hidden ring-1 ring-white/10 hover:ring-blue-400/40">
                  {user?.profileImageUrl || user?.avatarUrl ? (
                    <img src={(user?.profileImageUrl || user?.avatarUrl)} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full grid place-items-center bg-gray-800 text-gray-300 text-xs">
                      {(user?.name || user?.email || "U").slice(0,1).toUpperCase()}
                    </div>
                  )}
                </Link>
                <button onClick={onLogout} className="btn-gradient text-sm px-3 py-2">Log out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="hidden sm:inline-flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:text-white">
                  Sign in
                </Link>
                <Link to="/register" className="btn-gradient text-sm px-3 py-2">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Secondary nav */}
        <nav className="flex items-center justify-center gap-6 pb-3 text-sm text-gray-400">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `border-b-2 pb-2 font-semibold ${isActive ? "border-blue-500 text-white" : "border-transparent hover:text-white"}`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/files"
            className={({ isActive }) =>
              `border-b-2 pb-2 font-semibold ${isActive ? "border-blue-500 text-white" : "border-transparent hover:text-white"}`
            }
          >
            Files
          </NavLink>
          <NavLink
            to="/favorites"
            className={({ isActive }) =>
              `border-b-2 pb-2 font-semibold ${isActive ? "border-blue-500 text-white" : "border-transparent hover:text-white"}`
            }
          >
            Favorites
          </NavLink>
          <NavLink
            to="/shared"
            className={({ isActive }) =>
              `border-b-2 pb-2 font-semibold ${isActive ? "border-blue-500 text-white" : "border-transparent hover:text-white"}`
            }
          >
            Shared
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `border-b-2 pb-2 font-semibold ${isActive ? "border-blue-500 text-white" : "border-transparent hover:text-white"}`
            }
          >
            Settings
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
