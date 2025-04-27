import express from "express";
import mongoose from "mongoose";
import router from "./router/auth.router.js";
import cors from "cors";

const app = express();
const port = process.env.PORT || 5050;
const conn_string = process.env.CONN_STRING;

// Middleware
app.use(cors()); 
app.use(express.json()); 

mongoose.connect(conn_string, {
    useNewURLParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("Connected to MongoDB"))
.catch(err => console.log(e));

app.use("/api", router);

app.get("/", (req, res) => {
    res.send("Server is running");
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(port, () => {
    console.log(`Running at port ${port}`);
})




/*app.get("/", (res, req) => {
    req.send("Hello World")
})
*/