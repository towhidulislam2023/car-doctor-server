const express = require('express')
const app = express()
const port = process.env.PORT || 5000
const jwt = require("jsonwebtoken")
const cors = require('cors')
require('dotenv').config()
app.use(cors())
app.use(express.json())
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

console.log(process.env.ACCESS_TOKEN_SECRET);


const uri = `mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_PASS}@cluster0.w8zzyxt.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const verifyjwt = (req, res, next) => {
    console.log("hitting verify jwt");
    const authorization = req.headers.authorization
    console.log(authorization);
    if (!authorization) {
        res.status(401).send({ error: true, message: "Unauthorized access" })
        return; // add this to prevent further execution of the function
    }
    const token = authorization.split(' ')[1]
    console.log(token);

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
        if (error) {
            return res.status(401).send({ error: true, message: "Unauthorized access" })
        }
        req.decoded = decoded;
        next()
    })

} 

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        const servicesCollection = client.db("car-doctor-db").collection("servicesCollection")
        const bookingsCollection = client.db("car-doctor-db").collection("bookingsCollection")

        // jwt
        app.post("/jwt", (req, res) => {
            const user = req.body
            console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ token })
        })


        app.get("/services", async (req, res) => {
            const cursor = servicesCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })

        app.get("/services/:id", async (req, res) => {
            const id = req.params.id
            console.log(id);
            const query = { _id: new ObjectId(id) }

            const options = {
                // sort matched documents in descending order by rating
                sort: { "imdb.rating": -1 },
                // Include only the `title` and `imdb` fields in the returned document
                projection: { title: 1, img: 1, price: 1, }
            };
            const result = await servicesCollection.findOne(query, options)
            res.send(result)
        })



        app.post("/bookingServices", async (req, res) => {
            const bookedServices = req.body
            const result = await bookingsCollection.insertOne(bookedServices)
            res.send(result)
        })
        app.get("/bookkedServices", verifyjwt, async (req, res) => {
            const decoded=req.decoded
            // console.log("came Back After verify",decoded);
            if (decoded.email !== req.query.email) {
                return res.status(403).send({ error: true, message: "Forbidden access" })
                
            }
            let queary = {}
            if (req.query?.email) {
                queary = { email: req.query.email }

            }
            const cursor = bookingsCollection.find(queary)
            const result = await cursor.toArray()
            res.send(result)
        })
        app.delete('/deletebookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await bookingsCollection.deleteOne(query);
            res.send(result);
        })

        app.patch("/updatebookingSattus/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedBooking = req.body;
            console.log(updatedBooking);
            const updateDoc = {
                $set: {
                    status: updatedBooking.status
                },
            };
            const result = await bookingsCollection.updateOne(filter, updateDoc);
            res.send(result);
        });


        app.patch("/updatebookingSattus/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedBooking = req.body;
            console.log(updatedBooking);
            const updateDoc = {
                $set: {
                    status: updatedBooking.status
                },
            };
            const result = await bookingsCollection.updateOne(filter, updateDoc);
            res.send(result);
        });











        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})