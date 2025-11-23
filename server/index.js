
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "Server is working!" });
});

// Demo endpoint
app.post("/api/demo", (req, res) => {
  res.json({
    message: "Demo API working!",
    inputReceived: req.body,
    result: "This is a sample output."
  });
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
