const express = require('express')
const app = express()
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000
const cors = require('cors')
app.use(cors())
app.use(express.json())


const admin = require("firebase-admin");

const decoded = Buffer.from(process.env.FIREBASE_SERVICE_KEY, "base64").toString("utf8");
const serviceAccount = JSON.parse(decoded);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});



const VariryWithfirebase = async (req, res, next) => {
  const authorization = req.headers.authorization
  if (!authorization) {
    return res.status(401).send({ message: 'unauthorised access' })
  }
  const Token = req.headers.authorization.split(' ')[1]
  if (!Token) {
    return res.status(401).send({ message: 'unauthorised access' })
  }
  try {
    const decode = await admin.auth().verifyIdToken(Token)
    req.email_token = decode.email
    next()
  }
  catch {
    return res.status(401).send({ message: 'unauthorised access' })
  }
}



const jwt = require('jsonwebtoken');
const VariryWithCustomtoken = (req, res, next) => {

const authorization=req.headers.authorization
if(!authorization){
  return res.status(401).send({ message: 'unauthorised access' })
}
const Token=req.headers.authorization.split(' ')[1]
if(!Token){
    return res.status(401).send({ message: 'unauthorised access' })
}

jwt.verify(Token, process.env.Secrate_key, (err, decoded)=>{
  if (err) {
    return res.status(401).send({ message: 'unauthorised access' })
  }
   req.email_token=decoded.email
   next()
});



}


const uri = `mongodb+srv://${process.env.USET_DB}:${process.env.USER_PASSWORD}@cluster0.eepqhhq.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
})


const db = client.db("customar_db");
const productcollection = db.collection("products")
const bidscollection = db.collection("bids")
const userCollection = db.collection('Users')

async function run() {
  try {

    await client.connect();






    app.post('/products',VariryWithfirebase, async (req, res) => {
      const productData = req.body
      const result = await productcollection.insertOne(productData);
      res.send(result)
    })


    // app.post('/getToken', (req, res) => {
    //   const loggedUser = req.body
    // const token=  jwt.sign({
    //     loggedUser
    //   }, process.env.Secrate_key, { expiresIn: '1h' });
    //   res.send({Token:token})

    // })

    // app.post('/products', VariryWithCustomtoken, async (req, res) => {
    //   const productData = req.body
    //   const result = await productcollection.insertOne(productData);
    //   res.send(result)
    // })

    app.get('/products', async (req, res) => {
      const cursor = productcollection.find({})
      const allValues = await cursor.toArray();
      res.send(allValues)
    })

    app.get('/products-leatest', async (req, res) => {
      const cursor = productcollection.find({}).sort({ created_at: -1 }).limit(6)
      const allValues = await cursor.toArray()
      res.send(allValues)
    })


    //bids get api

    // app.get('/bids',  VariryWithCustomtoken, async (req, res) => {
    //   const email = req.query.email
    //   const query = {}
    //   if (email) { 
    //     if (email !== req.email_token) {
    //       return res.status(403).send({ message: 'Your request is forbidden' })
    //     }
    //     query.buyer_email = email
    //   }
    //   const cursor = bidscollection.find(query)
    //   const allValues = await cursor.toArray()
    //   console.log(allValues)
    //   res.send(allValues)
    // })


    app.get('/bids', VariryWithfirebase, async (req, res) => {
      const email = req.query.email
      const query = {}
      if (email) {
        if (email !== req.email_token) {
          return res.status(403).send({ message: 'You request is forebiden' })
        }
        query.buyer_email = email
      }
      const cursor = bidscollection.find(query)
      const allValues = await cursor.toArray()
      res.send(allValues)
    })
    app.get('/users', async (req, res) => {
      const cursor = userCollection.find({})
      const allValues = await cursor.toArray()
      res.send(allValues)
    })

    app.get('/products/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: id }
      const cursor = productcollection.find(query);
      const allValues = await cursor.toArray();
      res.send(allValues)
    })

    app.get('/products/bids/:productid', async (req, res) => {
      const id = req.params.productid
      const query = { productId: id }
      const cursor = bidscollection.find(query).sort({ bid_price: -1 })
      const allValues = await cursor.toArray()
      res.send(allValues)
    })

    //bids get spacific api

    app.get('/bids/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: id }
      const cursor = bidscollection.find(query)
      const allValues = await cursor.toArray()
      res.send(allValues)
    })



    // bids post api
    app.post('/bids', async (req, res) => {
      const bidsData = req.body
      const result = await bidscollection.insertOne(bidsData)
      res.send(result)
    })
    // user post api
    app.post('/users', async (req, res) => {
      const userData = req.body
      const email = userData.email
      const query = { email: email }
      const exits = await userCollection.findOne(query)
      if (exits) {
        res.send({ alreadyexits: 'email already exits' })
      }
      else {
        const result = await userCollection.insertOne(userData)
        res.send(result)
      }


    })
    app.delete('/products/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await productcollection.deleteOne(query);
      res.send(result)
    })
    // bids delete api
    app.delete('/bids/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await bidscollection.deleteOne(query)
      res.send(result)
    })
    app.patch('/products/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: id }
      const updateData = req.body
      const update = {
        $set: updateData
      }
      const result = await productcollection.updateOne(query, update);
      res.send(result)

    })

    //bids patch api
    app.patch('/bids/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: id }
      const updateData = req.body
      const update = {
        $set: updateData
      }
      const result = await bidscollection.updateOne(query, update)
      res.send(result)

    })
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {

  }
}
run().catch(console.dir);

// smart-deals-25
// ENdhwo2aMGU3HaEC

app.get('/', (req, res) => {
  res.send('Our smart server is running')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
