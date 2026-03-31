import { useNavigate } from "react-router-dom";

function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <div style={{ fontSize: "80px", marginBottom: "16px" }}>404</div>
      <h2 style={{ fontSize: "24px", marginBottom: "12px" }}>Page Not Found</h2>
      <p style={{ color: "#586069", marginBottom: "24px" }}>
        The page you are looking for does not exist.
      </p>
      <button className="btn btn-primary" onClick={() => navigate("/")}>
        🏠 Go Home
      </button>
    </div>
  );
}

export default NotFound;