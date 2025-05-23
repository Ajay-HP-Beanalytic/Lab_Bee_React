import { Breadcrumbs, Typography } from "@mui/material";
import { Link, useLocation } from "react-router-dom";

export default function BreadCrumbs({ customBreadcrumbs = null }) {
  const location = useLocation();

  //Define breadcrumb configurartion for different routes:
  const getBreadcrumbs = () => {
    //Fetch the pathname of the current route:
    const path = location.pathname;

    //If custom breadcrumbs are given then use them:
    if (customBreadcrumbs) {
      return customBreadcrumbs;
    }

    //Default breadcrumb configuration for the project management module:

    const breadcrumbConfigs = {
      "/project_management": [{ label: "Project Management", current: true }],
      "/add_task": [
        { label: "Project Management", link: "/project_management" },
        { label: "Add Task", current: true },
      ],
      "/update_task": [
        { label: "Project Management", link: "/project_management" },
        { label: "Edit Task", current: true },
      ],
    };

    //Check for dynamic routes such as '/update_task/:id':
    if (path.startsWith("/update_task/")) {
      return breadcrumbConfigs["/update_task"];
    }

    //Return the matching configuration or default:
    return (
      breadcrumbConfigs[path] || [
        { label: "Dashboard", link: "/" },
        { label: "Current Page", current: true },
      ]
    );
  };

  const breadcrumbs = getBreadcrumbs();

  console.log("Breadcrumbs==>: ", breadcrumbs);

  const handleClick = () => {
    alert("Div Clicked");
  };

  return (
    <div role="project-management-navigation">
      <Breadcrumbs>
        {breadcrumbs.map((crumb, index) => {
          if (crumb.current) {
            //return the current page as typography:
            return (
              <Typography key={index} sx={{ color: "text.primary" }}>
                {crumb.label}
              </Typography>
            );
          } else {
            //Navigation link: render as link:
            return (
              <Link
                key={index}
                component={Link}
                to={crumb.link}
                underline="hover"
                color="inherit"
              >
                {crumb.label}
              </Link>
            );
          }
        })}
      </Breadcrumbs>
    </div>
  );
}
