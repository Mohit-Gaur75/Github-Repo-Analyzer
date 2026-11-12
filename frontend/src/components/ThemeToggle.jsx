import { useTheme } from "../context/themeContext";

function ThemeToggle() {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={`Switch to ${isDark ? "Light" : "Dark"} Mode (currently ${theme})`}
      aria-label={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
      style={styles.toggleBtn}
    >
      <span style={styles.icon}>{isDark ? "☀️" : "🌙"}</span>
      <span style={styles.text}>{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}

const styles = {
  toggleBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    borderRadius: "20px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
    outline: "none"
  },
  icon: {
    fontSize: "14px",
    lineHeight: 1
  },
  text: {
    fontSize: "12px",
    letterSpacing: "0.3px"
  }
};

export default ThemeToggle;
