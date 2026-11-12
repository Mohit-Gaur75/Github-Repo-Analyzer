import { NavLink, useParams } from "react-router-dom";

function RepoNav() {
  const { owner, repo } = useParams();

  const links = [
    { to: `/dashboard/${owner}/${repo}`, label: "📋 Overview" },
    { to: `/languages/${owner}/${repo}`, label: "🌐 Languages" },
    { to: `/techstack/${owner}/${repo}`, label: "🛠️ Tech Stack" },
    { to: `/commits/${owner}/${repo}`, label: "📝 Commits" },
    { to: `/contributors/${owner}/${repo}`, label: "👥 Contributors" },
    { to: `/issues/${owner}/${repo}`, label: "🐛 Issues" },
    { to: `/prs/${owner}/${repo}`, label: "🔀 Pull Requests" },
    { to: `/releases/${owner}/${repo}`, label: "🏷️ Releases" },
    { to: `/quality/${owner}/${repo}`, label: "✅ Quality" },
    { to: `/security/${owner}/${repo}`, label: "🔒 Security" },
    { to: `/trends/${owner}/${repo}`, label: "📈 Trends" },
    { to: `/report/${owner}/${repo}`, label: "📑 Audit Report" },
    { to: `/activity/${owner}/${repo}`, label: "📊 Activity" },
    { to: `/ai/${owner}/${repo}`, label: "🤖 AI Insights", highlight: true }
  ];

  return (
    <nav style={styles.nav}>
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end
          style={({ isActive }) => ({
            ...styles.link,
            ...(isActive ? styles.active : {}),
            ...(link.highlight && !isActive ? styles.highlight : {})
          })}
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex",
    gap: "4px",
    flexWrap: "wrap",
    marginBottom: "24px",
    backgroundColor: "var(--bg-primary)",
    padding: "8px",
    borderRadius: "10px",
    border: "1px solid var(--border)",
    boxShadow: "var(--shadow-sm)"
  },
  link: {
    padding: "8px 14px",
    borderRadius: "6px",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: "500",
    color: "var(--text-secondary)",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap"
  },
  active: {
    backgroundColor: "var(--primary)",
    color: "#ffffff"
  },
  highlight: {
    backgroundColor: "var(--primary-light)",
    color: "var(--primary)",
    fontWeight: "700"
  }
};

export default RepoNav;