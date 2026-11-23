import { Route, Routes } from "react-router";
import Landing from "../pages/Landing";
import SignUp from "../pages/signup";
import Dashboard from "../pages/dashboard";
import NotFound from "../pages/notFound";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route path="/signup" element={<SignUp />} />
      
      <Route path="/dashboard" element={<Dashboard/>}/>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
