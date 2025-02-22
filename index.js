require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@elite.i866s.mongodb.net/?retryWrites=true&w=majority&appName=Elite`;
const client = new MongoClient(uri, { serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true } });

const db = client.db("taskZenDB");
const userCollection = db.collection("users");
const taskCollection = db.collection("tasks");

async function run() {
    // await client.connect();

    // ✅ Add User (If not exists)
    app.post('/users', async (req, res) => {
        const user = req.body;
        const query = { email: user.email };
        const existingUser = await userCollection.findOne(query);
        if (existingUser) return res.send({ message: 'User already exists', insertedId: null });
        const result = await userCollection.insertOne(user);
        res.send(result);
    });

    // ✅ Get tasks by user email
    app.get('/tasks', async (req, res) => {
        try {
            const email = req.query.email;
            const tasks = await taskCollection.find({ email }).sort({ order: 1 }).toArray();
    
            // Convert ObjectId to string for the client
            const tasksForClient = tasks.map((task) => ({
                ...task,
                _id: task._id.toString(), // Convert ObjectId to string
            }));
    
            res.json(tasksForClient);
        } catch (err) {
            console.error(err);
            res.status(500).send('Failed to fetch tasks');
        }
    });

    // ✅ Add a new task
    app.post('/tasks', async (req, res) => {
        const task = { ...req.body, timestamp: new Date() };
        const result = await taskCollection.insertOne(task);
        res.send(result);
    });

    // ✅ Update task category
    app.patch('/tasks/:id', async (req, res) => {
        const { id } = req.params;
        const { category, email } = req.body;

        if (!ObjectId.isValid(id)) return res.status(400).send('Invalid Task ID');

        const task = await taskCollection.findOne({ _id: new ObjectId(id) });
        if (!task || task.email !== email) return res.status(403).send('Access denied');

        await taskCollection.updateOne({ _id: new ObjectId(id) }, { $set: { category } });
        res.status(200).send('Task category updated');
    });

    // ✅ Delete task
    app.delete('/tasks/:id', async (req, res) => {
        const { id } = req.params;
        const { email } = req.body;

        if (!ObjectId.isValid(id)) return res.status(400).send({ message: 'Invalid Task ID' });

        const task = await taskCollection.findOne({ _id: new ObjectId(id) });
        if (!task || task.email !== email) return res.status(403).send({ message: 'Access denied' });

        const result = await taskCollection.deleteOne({ _id: new ObjectId(id) });
        res.send(result);
    });

    // ✅ Reorder tasks within a category
    app.patch('/tasks/reorder', async (req, res) => {
        console.log("Request body:", req.body); // Log the entire request body
    
        try {
            const { updates, email } = req.body;
    
            // Validate request data
            if (!updates || !Array.isArray(updates) || updates.length === 0) {
                return res.status(400).json({ message: "Invalid request: updates array is required" });
            }
    
            if (!email) {
                return res.status(400).json({ message: "Invalid request: email is required" });
            }
    
            // Convert _id to ObjectId and update each task
            const updatePromises = updates.map((task) => {
                if (!task._id || !ObjectId.isValid(task._id)) {
                    throw new Error(`Invalid Task ID: ${task._id}`);
                }
    
                return taskCollection.updateOne(
                    { _id: new ObjectId(task._id), email }, // Convert _id to ObjectId
                    { $set: { order: task.order, category: task.category } }
                );
            });
    
            await Promise.all(updatePromises);
    
            res.status(200).json({ message: "Tasks reordered successfully" });
        } catch (error) {
            console.error("Error updating tasks:", error);
            res.status(400).json({ message: `Error: ${error.message}` });
        }
    });


    // console.log("✅ Database connected");
}

run().catch(console.dir);

app.get('/', (req, res) => res.send('TaskZen is running'));
app.listen(port, () => console.log(`🚀 Server running on port: ${port}`));
