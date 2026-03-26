import { Button, TextField, Box } from "@mui/material";
import { useState } from "react";
import { serverBaseAddress } from "../Pages/APIPage";
import axios from "axios";

const SocialMediaConetntDashboard = () => {
  const [topic, setTopic] = useState("");
  const [contentResult, setContentResult] = useState("");

  const handleSubmitTopic = async (e) => {
    alert(`Topic is--> ${topic}`);

    try {
      const submitResponse = await axios.post(
        `${serverBaseAddress}/api/postTopic`,
        { data: topic },
      );
      console.log("contentResult is-->", submitResponse);

      setContentResult(submitResponse.data);
      // console.log("contentResult is-->", contentResult);
    } catch (error) {
      console.error("Error while submitting the Topic");
    }
  };

  const handleClearTopic = () => {
    setTopic("");
    setContentResult("");
  };
  return (
    <>
      <h1>This is BEA Social Media Content Dashboard</h1>

      <Box sx={{ display: "flex", alignItems: "center" }}>
        <TextField
          variant="outlined"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter your topic.."
        />

        <Button variant="contained" onClick={handleSubmitTopic}>
          Submit
        </Button>

        <Button variant="contained" onClick={handleClearTopic}>
          Clear
        </Button>
      </Box>

      <div>
        <h2>Topic is : {topic}</h2>
        <p>{contentResult.linkedin}</p>
        <br />
        <p>{contentResult.x}</p>
      </div>
    </>
  );
};

export default SocialMediaConetntDashboard;
