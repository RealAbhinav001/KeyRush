import AppRoutes from "./routes/appRoute.jsx";
import { useEffect } from "react";
import { refreshToken, getMe } from "./api/auth.js";
import { signedIn, signedOut } from "./features/auth/authSlice.js";
import { useDispatch, useSelector } from "react-redux";
import BootScreen from "./components/BootScreen.jsx";

const App = () => {
  const dispatch = useDispatch();

  const status = useSelector((state) => state.auth.status);

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

  return status === "checking" ? <BootScreen /> : <AppRoutes />;
};

export default App;
