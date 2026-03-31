import { NavLink, useParams } from "react-router-dom";

function RepoNav() {
  const { owner, repo } = useParams();

  const links = [
    { to: `/dashboard/${owner}/${repo}`, label: "📋 Overview" },
    { to: `/languages/${owner}/${repo}`, label: "🌐 Languages" },
    { to: `/commits/${owner}/${repo}`, label: "📝 Commits" },
    { to: `/contributors/${owner}/${repo}`, label: "👥 Contributors" },
    { to: `/issues/${owner}/${repo}`, label: "🐛 Issues" },
    { to: `/prs/${owner}/${repo}`, label: "🔀 Pull Requests" },
    { to: `/quality/${owner}/${repo}`, label: "✅ Quality" },
    { to: `/security/${owner}/${repo}`, label: "🔒 Security" }
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
            ...(isActive ? styles.active : {})
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
    backgroundColor: "#ffffff",
    padding: "8px",
    borderRadius: "10px",
    border: "1px solid #e1e4e8",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
  },
  link: {
    padding: "8px 14px",
    borderRadius: "6px",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: "500",
    color: "#586069",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap"
  },
  active: {
    backgroundColor: "#0366d6",
    color: "#ffffff"
  }
};

export default RepoNav;