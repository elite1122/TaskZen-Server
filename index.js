require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@elite.i866s.mongodb.net/?retryWrites=true&w=majority&appName=Elite`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const userCollection = client.db("taskZenDB").collection("users");

async function run() {
    
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Insightly is running');
});

app.listen(port, () => {
    console.log(`Insightly is running on port: ${port}`);
});