const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.MongoDB_Uer}:${process.env.MongoDB_Pass}@cluster0.lvcvanp.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    client.connect();
    const collection = client.db("test").collection("devices");
    const userCollection = client.db("users").collection("user-collection");
    const jobCollection = client.db("jobs").collection("job-collection");

    // create user
    app.post("/user", async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // get user
    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;

      const result = await userCollection.findOne({ email });

      if (result?.email) {
        return res.send({ status: true, data: result });
      }
      res.send({ status: false });
    });

    // create job
    app.post("/create-job", async (req, res) => {
      const job = req.body;
      const result = await jobCollection.insertOne(job);
      res.send({ status: true, data: result });
    });

    //jobs
    app.get("/jobs", async (req, res) => {
      const cursor = await jobCollection.find({});
      const result = await cursor.toArray();
      res.send({ status: true, data: result });
    });

    // job by id
    app.get("/job/:id", async (req, res) => {
      const id = req.params.id;
      const result = await jobCollection.findOne({ _id: ObjectId(id) });
      res.send({ status: true, data: result });
    });
  } finally {
    // client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("hlw Job portal server");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
