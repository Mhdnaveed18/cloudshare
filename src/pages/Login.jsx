import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import authApi from "../api/auth";
import { loginSuccess } from "../store/authSlice";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();

  async function onSubmit(values) {
    try {
      const { token, user } = await authApi.login(values);
      dispatch(loginSuccess({ token, user }));
      toast.success(`Welcome back, ${user.name}!`);
      navigate("/");
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Login failed";
      toast.error(msg);
    }
  }


  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card p-8">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Welcome back</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Sign in to your CloudShare account.</p>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <input type="email" {...register("email", { required: true })} className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
            <input type="password" {...register("password", { required: true })} className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div className="flex items-center justify-between">
            <Link to="/forgot-password" className="text-sm font-medium text-blue-400 hover:underline">Forgot password?</Link>
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-gradient w-full py-2.5 disabled:opacity-60 disabled:cursor-not-allowed">
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          New here? <Link to="/register" className="font-medium text-blue-400 hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
