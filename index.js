const express = require('express')
const mongoose = require('mongoose')
const {ApolloServer, gql} = require('apollo-server-express')
const cors = require('cors')
const session = require('express-session')
const mongoDbSession = require('connect-mongodb-session')
const cookieParser = require('cookie-parser')
const userApiRouter = require('./router/userRouter')
const typeDefs = require('./schema')
const resolvers = require('./resolvers')


const app = express()
const port = 3002
const url ='place_your_mongodb_url'

app.use(cookieParser())
app.use(express.json())
app.use(cors({
    origin: ['http://localhost:3000'],
    methods : ['GET', 'POST', 'DELETE', 'PUT'],
    credentials: true,
}))


app.use(session({
    secret: 'secret',
    resave : false,
    saveUninitialized : true,
    cookie: { secure: false, httpOnly: true, sameSite: 'Strict' }
}))

mongoose.connect(url, {useNewUrlParser : true, useUnifiedTopology : true}). then(()=> {console.log('DB connected')})
.catch((err) => {console.log(err.message)})


const server = new ApolloServer({ typeDefs, resolvers });

app.use("/api", userApiRouter);

async function startServer() {
  await server.start();
  server.applyMiddleware({ app });
  app.listen(port, () => {
    console.log(`Server is live on ${port}`);
  });
}

startServer();
