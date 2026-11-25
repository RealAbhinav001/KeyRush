import { useEffect, useState } from "react";
import "../pages/landing.css";
import "./bootScreen.css";

const BootScreen = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setShow(true);
    }, 300);

    return () => clearTimeout(timerId);
  }, []);

  return (
    <div className="kr3 kr3-boot">
      {show && (
        <div className="kr3-boot-inner" role="status">
          <div className="kr3-boot-gantry" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className="kr3-boot-light" style={{ "--n": n }} />
            ))}
          </div>
          <p>Checking your session…</p>
        </div>
      )}
    </div>
  );
};

export default BootScreen;
