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

    const userCollection = client.db("users").collection("user-collection");
    const jobCollection = client.db("jobs").collection("job-collection");
    const messageCollection = client.db("Message").collection("messages");
    const conversationCollection = client
      .db("Message")
      .collection("conversation");

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

    // view user
    app.get("/view-user/:id", async (req, res) => {
      const id = req.params.id;

      const result = await userCollection.findOne({ _id: ObjectId(id) });

      if (result?.email) {
        return res.send({ status: true, data: result });
      }
      res.send({ status: false });
    });

    //---------------------------- Job ----------------------------
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

    //applied job
    app.get("/applied-jobs/:email", async (req, res) => {
      const email = req.params.email;
      const query = { applicants: { $elemMatch: { email: email } } };
      const cursor = jobCollection.find(query).project({ applicants: 0 });
      const result = await cursor.toArray();

      res.send({ status: true, data: result });
    });

    //applied job
    app.get("/employer-jobs/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const cursor = jobCollection.find(query);
      const result = await cursor.toArray();

      res.send({ status: true, data: result });
    });

    //apply
    app.patch("/close-job", async (req, res) => {
      const jobId = req.body.jobId;

      const filter = { _id: ObjectId(jobId) };
      const updateDoc = {
        $set: { status: "Closed" },
      };
      const result = await jobCollection.updateOne(filter, updateDoc);

      if (result.acknowledged) {
        return res.send({ status: true, data: result });
      }

      res.send({ status: false });
    });

    //Close job status
    app.patch("/apply", async (req, res) => {
      const jobId = req.body.jobId;
      const userId = req.body.userId;
      const email = req.body.email;

      const filter = { _id: ObjectId(jobId) };
      const updateDoc = {
        $push: { applicants: { id: ObjectId(userId), email } },
      };

      const result = await jobCollection.updateOne(filter, updateDoc);

      if (result.acknowledged) {
        return res.send({ status: true, data: result });
      }

      res.send({ status: false });
    });

    //ask-question
    app.patch("/ask-question", async (req, res) => {
      const userId = req.body.userId;
      const jobId = req.body.jobId;
      const email = req.body.email;
      const question = req.body.question;

      const filter = { _id: ObjectId(jobId) };
      const updateDoc = {
        $push: {
          queries: {
            id: ObjectId(userId),
            email,
            question: question,
            reply: [],
          },
        },
      };

      const result = await jobCollection.updateOne(filter, updateDoc);

      if (result?.acknowledged) {
        return res.send({ status: true, data: result });
      }

      res.send({ status: false });
    });

    // question reply
    app.patch("/que-answer", async (req, res) => {
      const userId = req.body.userId;
      const reply = req.body.reply;

      const filter = { "queries.id": ObjectId(userId) };

      const updateDoc = {
        $push: {
          "queries.$[user].reply": reply,
        },
      };
      const arrayFilter = {
        arrayFilters: [{ "user.id": ObjectId(userId) }],
      };

      const result = await jobCollection.updateOne(
        filter,
        updateDoc,
        arrayFilter
      );
      if (result.acknowledged) {
        return res.send({ status: true, data: result });
      }

      res.send({ status: false });
    });

    //------------------------- Message --------------------
    // create conversation
    app.post("/create-conversation", async (req, res) => {
      const data = req.body;
      const post = { member: [data.senderId, data.receiverId] };
      const result = await conversationCollection.insertOne(post);
      res.send(result);
    });

    // get conversation
    app.get("/get-conversation/:userId", async (req, res) => {
      const senderId = req.params.userId;

      const query = { member: { $in: [senderId] } };
      const cursor = await conversationCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // create new massage
    app.post("/create-message", async (req, res) => {
      const { conversionId, senderId, senderInfo, textMessage, sendTime } =
        req.body;

      const message = {
        conversionId,
        senderId,
        senderInfo,
        textMessage,
        sendTime,
      };

      const result = await messageCollection.insertOne(message);
      res.send(result);
    });

    // get chat message
    app.get("/get-messages/:Id", async (req, res) => {
      const id = req.params.Id;
      const query = { conversionId: id };

      const cursor = await messageCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    //
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
