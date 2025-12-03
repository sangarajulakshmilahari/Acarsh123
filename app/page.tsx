"use client";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { setUser } from "../store/userSlice";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success) {
        dispatch(setUser({ name: data.name, token: data.token }));
        localStorage.setItem("user", JSON.stringify({ name: data.name, token: data.token }));
        router.push("/webpage");
      } else {
        alert("Invalid credentials");
      }
    } catch (err) {
      alert("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{height: "75vh",display: "flex",justifyContent: "center",alignItems: "center",}} >
      <div className="card" style={{  background: "var(--card)",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            width: "100%",
            maxWidth: "400px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            textAlign: "center", }}>
        <p style={{textAlign:"center"}}>Sign in to your Account</p>

        {/*  Form handles Enter key automatically */}
        <form onSubmit={handleLogin} style={{ display: "grid", gap:10 }}>
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
          />
          <label className="remember-me" style={{   display: "flex",
              justifyContent: "space-between",
              width: "100%",
              fontSize: "14px",
              alignItems: "center",
              margin: "6px 0 14px 0",
              gap: "10px",}}>
            <span>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)} style={{}}
              />
              Remember me
            </span>
            <a href="#" style={{color: "#0077ff",cursor: "pointer",textDecoration: "none", }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
            >
            Forgot password?
            </a>

          </label>

          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: "#f56c00",
               padding: "9px 12px",
               borderRadius: "10px",
               cursor: "pointer",
               width: "25%",
               margin: "10px Auto",
              display: "block",
              textAlign: "center",
              outline: "none",
              border: "none"
            }}
          >
            {loading ? "Signing In..." : "Sign In"}

          </button>

          <p>
            Use <b>admin / 1234</b> to login (demo)
          </p>
        </form>
      </div>
    </div>
  );
}