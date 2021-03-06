const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const stripe = require('stripe')(process.env.SECRET_KEY);
const port = process.env.PORT || 4000;

app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vngt4.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


//token verify

function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorized Access' });
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, 'secret', function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' });
        }
        if (decoded) {
            req.decoded = decoded;
            next();
        }
    });
}


const run = async () => {
    try {
        await client.connect()
        const productCollection = client.db("venomComputerWorld").collection("products");
        const orderCollection = client.db("venomComputerWorld").collection("orders");
        const userCollection = client.db("venomComputerWorld").collection("users");
        const reviewCollection = client.db("venomComputerWorld").collection("reviews");


        //verify admin


        const verifyAdmin = async (req, res, next) => {
            // console.log(req);
            const email = req.decoded;
            const requester = await userCollection.findOne({ email });
            console.log(requester);
            if (requester.role === 'admin') {
                next();
            } else {
                return res.status(403).send({ message: 'Forbidden Access' });
            }
        }

        //payment stripe 
        app.post("/create-payment-intent", async (req, res) => {
            const { price } = req.body;
            const amount = price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                automatic_payment_methods: {
                    enabled: true,
                },
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        //add product api
        app.post('/add-product', verifyToken, verifyAdmin, async (req, res) => {
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
        app.get('/get-product', verifyToken, verifyAdmin, async (req, res) => {
            const result = await productCollection.find().toArray();
            res.send(result)
        })
        //get six product api
        app.get('/get-six-product', async (req, res) => {
            const result = await productCollection.find().limit(6).toArray();
            res.send(result)
        })

        //get product by id api
        app.get('/get-id-product/:id', async (req, res) => {
            const { id } = req.params;
            const filter = { _id: ObjectId(id) }
            const result = await productCollection.findOne(filter);
            res.send(result)
        })

        //delete product by id api
        app.delete('/delete-product/:id', async (req, res) => {
            const { id } = req.params;
            const filter = { _id: ObjectId(id) }
            const result = await productCollection.deleteOne(filter);
            res.send(result)
        })




        //add order api
        app.post('/add-order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result)
        })
        //get order api
        app.get('/get-order/', verifyToken, verifyAdmin, async (req, res) => {
            const result = await orderCollection.find().toArray();
            res.send(result)
        })
        //get order by email api
        app.get('/get-order/:email', verifyToken, async (req, res) => {
            const { email } = req.params;
            const filter = { email }
            const result = await orderCollection.find(filter).toArray();
            res.send(result)
        })
        //get order by id api
        app.get('/get-order-id/:id', async (req, res) => {
            const { id } = req.params;
            const filter = { _id: ObjectId(id) }
            const result = await orderCollection.findOne(filter);
            res.send(result)
        })

        //update order by id api
        app.patch('/update-order/:id', async (req, res) => {
            const { id } = req.params;
            const filter = { _id: ObjectId(id) }
            const order = req.body;
            const updatedOrder = { $set: order }
            const result = await orderCollection.updateOne(filter, updatedOrder);
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
        app.get('/get-user', verifyToken, async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result)
        })
        //get user by email api
        app.get('/get-user/:email', verifyToken, async (req, res) => {
            const { email } = req.params;
            const filter = { email }
            const result = await userCollection.findOne(filter)
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

        //add review api
        app.post('/add-review', async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result)
        })

        //get review by email api
        app.get('/get-review/:email', async (req, res) => {
            const { email } = req.params;
            const filter = { email: email }
            const result = await reviewCollection.findOne(filter)
            res.send(result)
        })
        //get review api
        app.get('/get-review', async (req, res) => {
            const result = await reviewCollection.find().toArray();
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
