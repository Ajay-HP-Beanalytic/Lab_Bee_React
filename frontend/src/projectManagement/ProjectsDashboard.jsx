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

const ProjectManagementDashboard = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

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
          <Tab label="Sprint Backlog" />
          <Tab label="Kanban Board" />
          <Tab label="Sprint Planning" />
          <Tab label="Retrospective" />
          <Tab label="Velocity Chart" />
          <Tab label="My Tasks" />
        </Tabs>

        {/* Optional Sprint Selector */}
        <SprintSelector />
      </Box>

      {tabIndex === 0 && <SprintBacklog />}
      {tabIndex === 1 && <KanbanSheet />}
      {tabIndex === 2 && <VelocityChart />}
      {tabIndex === 3 && <RetrospectiveNotes />}
      {tabIndex === 4 && <HoursAndStorypoints />}
      {tabIndex === 5 && <MyTasks />}
    </Box>
  );
};

export default ProjectManagementDashboard;
