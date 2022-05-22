const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');

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
        const orderCollection = client.db("venomComputerWorld").collection("orders");
        const userCollection = client.db("venomComputerWorld").collection("users");

        //add product api
        app.post('/add-product', async (req, res) => {
            const product = req.body;
            const result = await productCollection.insertOne(product);
            res.send(result)
        })
        //update product api
        app.patch('/update-product/:id', async (req, res) => {
            const { id } = req.params;
            const filter = { _id: ObjectId(id) }
            const product = req.body;
            const updateProduct = { $set: product }
            const result = await productCollection.updateOne(filter, updateProduct);
            res.send(result)
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



        //add order api
        app.post('/add-order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result)
        })
        //get order api
        app.get('/get-order/:email', async (req, res) => {
            const { email } = req.params;
            const filter = { email }
            const result = await orderCollection.find(filter).toArray();
            res.send(result)
        })

        //delete order api
        app.delete('/delete-order/:id', async (req, res) => {
            const { id } = req.params;
            const filter = { _id: ObjectId(id) }
            const result = await orderCollection.deleteOne(filter);
            res.send(result)
        })

        //add user api
        app.put('/add-user/:email', async (req, res) => {
            const { email } = req.params;
            const filter = { email }
            const user = req.body;
            const options = { upsert: true };
            const updatedUser = { $set: user };
            const token = jwt.sign(email, 'secret');
            console.log(token);
            const result = await userCollection.updateOne(filter, updatedUser, options);
            res.send({ result, token })
        })

        //get user api
        app.get('/get-user', async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result)
        })

         //update user api
         app.patch('/update-user/:id', async (req, res) => {
            const { id } = req.params;
            const filter = { _id: ObjectId(id) }
            const user = req.body;
            const updatedUser = { $set: user }
            const result = await userCollection.updateOne(filter, updatedUser);
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
