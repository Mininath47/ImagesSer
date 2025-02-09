const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
const PORT = 5000;
const DB_URL = "mongodb+srv://meninathhonmane2355:Meni4765@test.iq88b.mongodb.net/";
const DB_NAME = "imageDB";

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

let db;
MongoClient.connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((client) => {
        db = client.db(DB_NAME);
        console.log("MongoDB Connected...");
    })
    .catch((err) => console.log(err));

// Configure multer storage
const storage = multer.diskStorage({
    destination: "./uploads/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage: storage });

// **1. Upload an image**
app.post("/upload", upload.single("image"), async (req, res) => {
    if (!req.file) return res.status(400).send("No file uploaded");

    const imagePath = `/uploads/${req.file.filename}`;
    const result = await db.collection("images").insertOne({ path: imagePath });

    res.json({ message: "Image uploaded", imageId: result.insertedId, path: imagePath });
});

// **2. Get all images**
app.get("/images", async (req, res) => {
    const images = await db.collection("images").find().toArray();
    res.json(images);
});

// **3. Update an image**
app.put("/update/:id", upload.single("image"), async (req, res) => {
    if (!req.file) return res.status(400).send("No file uploaded");

    const imageId = req.params.id;
    const newImagePath = `/uploads/${req.file.filename}`;

    const image = await db.collection("images").findOne({ _id: new ObjectId(imageId) });
    if (!image) return res.status(404).send("Image not found");

    fs.unlinkSync("." + image.path); // Delete old file

    await db.collection("images").updateOne({ _id: new ObjectId(imageId) }, { $set: { path: newImagePath } });

    res.json({ message: "Image updated", path: newImagePath });
});

// **4. Delete an image**
app.delete("/delete/:id", async (req, res) => {
    const imageId = req.params.id;

    const image = await db.collection("images").findOne({ _id: new ObjectId(imageId) });
    if (!image) return res.status(404).send("Image not found");

    fs.unlinkSync("." + image.path); // Delete file from uploads folder

    await db.collection("images").deleteOne({ _id: new ObjectId(imageId) });

    res.json({ message: "Image deleted" });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
