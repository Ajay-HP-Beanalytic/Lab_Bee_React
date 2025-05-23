import React, { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import axios from "axios";
import { Box, Button, Card, Paper, Typography } from "@mui/material";
import { serverBaseAddress } from "../Pages/APIPage";
import useProjectManagementStore from "./ProjectStore";
import dayjs from "dayjs";
import SearchBar from "../common/SearchBar";
import EmptyCard from "../common/EmptyCard";
import VisibilityIcon from "@mui/icons-material/Visibility";

const columns = ["To Do", "In Progress", "Done", "Blocked"];
const columnColors = {
  "To Do": "#e3f2fd", // Light Blue
  "In Progress": "#fff9c4", // Light Yellow
  Done: "#c8e6c9", // Light Green
  Blocked: "#ffcdd2", // Light Red
};
const cardBackgroundColor = "#ffffff"; // White for cards

const KanbanSheet = () => {
  const kanbanSheetData = useProjectManagementStore(
    (state) => state.allTasksData.kanbanSheetData
  );
  const setKanbanSheetData = useProjectManagementStore(
    (state) => state.setKanbanSheetData
  );

  const handleDragEnd = async ({ source, destination }) => {
    if (!destination) return;
    const sourceCol = source.droppableId;
    const destCol = destination.droppableId;
    if (sourceCol === destCol) return;

    const movedTask = kanbanSheetData[sourceCol][source.index];
    if (!movedTask) return;

    await axios.post(`${serverBaseAddress}/api/updateTaskStatus`, {
      task_id: movedTask.id,
      status: destCol,
    });

    const updated = { ...kanbanSheetData };
    updated[sourceCol] = [...updated[sourceCol]];
    updated[destCol] = [...(updated[destCol] || [])];

    updated[sourceCol].splice(source.index, 1);
    updated[destCol].splice(destination.index, 0, movedTask);
    setKanbanSheetData(updated); // If you’re updating Zustand store
  };

  const handleViewTask = (taskId) => {
    alert(`Viewing task with ID: ${taskId}`); // Replace with actual task view logictaskId);
    TaskDetailsCard(taskId);
  };

  return (
    <>
      <h2>Status Wise Tasks</h2>
      <Paper sx={{ padding: "20px" }}>
        <SearchBar placeholder="Search Tasks" />

        {Object.keys(kanbanSheetData || {}).length === 0 ? (
          <EmptyCard message="No Data Found." />
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Box display={"flex"} gap={2} mt={1} sx={{ width: "100%" }}>
              {columns.map((col) => (
                <Droppable
                  droppableId={col}
                  key={col}
                  sx={{ width: "100%", backgroundColor: "red" }}
                >
                  {(provided) => (
                    <Paper
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      sx={{
                        backgroundColor: columnColors[col],
                        borderRadius: "8px",
                        boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
                        display: "flex",
                        flexDirection: "column",
                        width: 500,
                        minHeight: 400,
                        p: 2,
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          mb: 2,
                          p: 1,
                          backgroundColor: "rgba(0,0,0,0.05)",
                          borderRadius: "4px",
                          textAlign: "center",
                        }}
                      >
                        {col}
                      </Typography>
                      {kanbanSheetData[col]?.map((task, index) => (
                        <Draggable
                          draggableId={task.id.toString()}
                          index={index}
                          key={task.id}
                        >
                          {(provided) => (
                            <Paper
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              sx={{
                                p: 1.5,
                                my: 1,
                                borderRadius: "4px",
                                backgroundColor: cardBackgroundColor,
                                boxShadow: "0px 1px 3px rgba(0,0,0,0.15)",
                              }}
                            >
                              <Typography>
                                <span style={{ fontWeight: "bold" }}>
                                  Title:{" "}
                                </span>
                                <span>{task.title}</span>
                              </Typography>
                              <Typography>
                                <span style={{ fontWeight: "bold" }}>
                                  Assigned To:{" "}
                                </span>
                                <span>{task.assigned_to}</span>
                              </Typography>
                              <Typography>
                                <span style={{ fontWeight: "bold" }}>
                                  Priority:{" "}
                                </span>
                                <span>{task.priority}</span>
                              </Typography>
                              <Typography>
                                <span style={{ fontWeight: "bold" }}>
                                  Due Date:{" "}
                                </span>
                                <span>
                                  {dayjs(task.task_due_date).format(
                                    "DD-MM-YYYY"
                                  )}
                                </span>
                              </Typography>

                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "flex-end", // Aligns button to the right
                                  mt: 1, // Adds some margin top to the button
                                }}
                              >
                                <Button
                                  onClick={() => handleViewTask(task.id)}
                                  size="medium"
                                  startIcon={<VisibilityIcon />}
                                >
                                  Show
                                </Button>
                              </Box>
                            </Paper>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </Paper>
                  )}
                </Droppable>
              ))}
            </Box>
          </DragDropContext>
        )}
      </Paper>
    </>
  );
};

export default KanbanSheet;

const TaskDetailsCard = (taskId) => {
  return (
    <Paper>
      <Card>Entered Task Detail is: {taskId}</Card>
    </Paper>
  );
};
