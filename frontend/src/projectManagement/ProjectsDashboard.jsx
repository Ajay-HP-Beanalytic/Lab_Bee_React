import { useState } from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import SprintBacklog from "./SprintBacklog";
import KanbanSheet from "./KanbanSheet";
import VelocityChart from "./VelocityChart";
import RetrospectiveNotes from "./Retrospective";
import HoursAndStorypoints from "./HoursAndStorypoints";
import MyTasks from "./MyTasks";
import SprintSelector from "./SprintSelector";
import CreateProject from "./CreateProject";
import ProjectsTable from "./ProjectsTable";

const ProjectManagementDashboard = () => {
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (_, newValue) => setTabIndex(newValue);

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Tabs value={tabIndex} onChange={handleTabChange}>
          <Tab label="Projects List" />
          <Tab label="Tasks List" />
          <Tab label="Kanban Board" />
          <Tab label="Sprint Planning" />
          <Tab label="Retrospective" />
          <Tab label="Velocity Chart" />
          <Tab label="My Tasks" />
        </Tabs>

        {/* Optional Sprint Selector */}
        <SprintSelector />
      </Box>

      {/* {tabIndex === 0 && <CreateProject />}ProjectsTable */}
      {tabIndex === 0 && <ProjectsTable />}
      {tabIndex === 1 && <SprintBacklog />}
      {tabIndex === 2 && <KanbanSheet />}
      {tabIndex === 3 && <VelocityChart />}
      {tabIndex === 4 && <RetrospectiveNotes />}
      {tabIndex === 5 && <HoursAndStorypoints />}
      {tabIndex === 6 && <MyTasks />}
    </Box>
  );
};

export default ProjectManagementDashboard;
