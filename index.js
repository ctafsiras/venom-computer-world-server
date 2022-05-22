const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 4000;

app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vngt4.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


const run = async () => {
    try {
        await client.connect()
        const productCollection = client.db("venomComputerWorld").collection("products");

        //add product api
        app.post('/add-product', async (req, res) => {
            const product = req.body;
            const result = await productCollection.insertOne(product);
            res.send({ success: true, result })
        })


        //get product api
        app.get('/get-product', async (req, res) => {
            const result = await productCollection.find().toArray();
            res.send(result)
        })

        //get product by id api
        app.get('/get-id-product/:id', async (req, res) => {
            const { id } = req.params;
            const filter = { _id: ObjectId(id) }
            const result = await productCollection.findOne(filter);
            res.send(result)
        })
    }
    finally {

    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send("It's Working!")
})

app.listen(port, () => {
    console.log('listening server on port ', port);
})
