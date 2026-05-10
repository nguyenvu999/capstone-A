import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMe } from "../api/authApi";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { finishLogin, setLoading } = useAuth();

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        // Lúc này request này sẽ mang theo Cookie access_token
        const res = await getMe(); 
        if (res.data) {
          finishLogin(res.data);
          // Chuyển hướng ngay lập tức
          navigate("/map", { replace: true });
        }
      } catch (err) {
        console.error("Lỗi callback:", err);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Đang xác thực thông tin...</h2>
      <p>Vui lòng đợi trong giây lát.</p>
    </div>
  );
}