import express from "express";
import cors from "cors";
import { Sequelize, DataTypes } from "sequelize";
import { nanoid } from "nanoid";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import pg from "pg";
dotenv.config();

//desclaration of variables and also loading of environment variables
const app = express();
const PORT = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//database connection
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    dialectModule: pg,
  }
);

//checking for database connection

sequelize
  .authenticate()
  .then(() => console.log("Connection has been established successfully"))
  .catch((err) => console.error("Unable to connect to the database:", err));

//defining url models
const Url = sequelize.define("Url", {
  originalUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  shortenedUrl: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
});

//syncing database with models
sequelize.sync().then(() => {
  console.log("Database connected successfully");
});

//Api route to shorten url
app.post("/shorten", async (req, res) => {
  const { originalUrl } = req.body;
  const shortenedUrl = nanoid(3);

  try {
    const newUrl = await Url.create({ originalUrl, shortenedUrl });
    res.status(201).json({ originalUrl, shortenedUrl });
  } catch (error) {
    res.status(500).json({ error: "Error creating shortened URL" });
  }
});

app.get("/:shortenedUrl", async (req, res) => {
  const { shortenedUrl } = req.params;
  try {
    const url = await Url.findOne({ where: { shortenedUrl } });
    if (url) {
      res.redirect(url.originalUrl);
    } else {
      res.status(404).json({ error: "Shortened URL not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error redirecting" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
