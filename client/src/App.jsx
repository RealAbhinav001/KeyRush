import AppRoutes from "./routes/appRoute.jsx";
import { useEffect } from "react";
import { refreshToken, getMe } from "./api/auth.js";
import { signedIn, signedOut } from "./features/auth/authSlice.js";
import { useDispatch } from "react-redux";

const App = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const restoreSession = async () => {
      try {
        await refreshToken();

        const user = await getMe();
        dispatch(signedIn(user));
      } catch {
        dispatch(signedOut());
      }
    };

    restoreSession();
  }, [dispatch]);

  return <AppRoutes />;
};

export default App;
