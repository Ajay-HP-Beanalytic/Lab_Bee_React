import { Breadcrumbs, Typography } from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

export default function BreadCrumbs({ customBreadcrumbs }) {
  const location = useLocation();
  const path = location.pathname;

  const breadcrumbs = customBreadcrumbs || [];

  if (!breadcrumbs || breadcrumbs.length === 0) {
    return null;
  }

  return (
    <div role="project-management-navigation">
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
      >
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1 || crumb.current;

          if (isLast) {
            return (
              <Typography
                key={index}
                color="text.primary"
                sx={{ fontWeight: "bold" }}
              >
                {crumb.label}
              </Typography>
            );
          }

          return (
            <Link
              key={index}
              to={crumb.link}
              style={{
                textDecoration: "none",
                color: "#1976d2",
              }}
              onMouseEnter={(e) =>
                (e.target.style.textDecoration = "underline")
              }
              onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
            >
              {crumb.label}
            </Link>
          );
        })}
      </Breadcrumbs>
    </div>
  );
}
