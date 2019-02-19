const { ApolloServer, AuthenticationError, gql } = require('apollo-server-express')
const express = require('express')
const cors = require('cors')

const defaultUserClaims = require('../firebase/defaultUserClaims')
const { auth, db, admin } = require('../firebase')
const schema = require('./schema')
const resolvers = require('./resolvers')

const getUserFromRequest = async req => {
  const token = req.headers['x-token']
  console.log('REQUEST TOKEN', token)
  if(token){
    try {
      const signIn = await auth().signInWithCustomToken(token)
      const tokenResult = await signIn.user.getIdTokenResult()
      console.log('claims', tokenResult.claims)
      return {
        ...signIn.user.toJSON(),
        claims: tokenResult.claims
      }
    } catch (e) {
      console.log('Session error', e)
      throw e
    }
  }
}

const spawnServer = () => {

  const app = express()

  app.use(cors())

  const server = new ApolloServer({
    typeDefs: schema,
    resolvers,
    uploads: false,
    introspection: true,
    playground: true,
    context: async ({ req }) => {
      const currentUser = await getUserFromRequest(req)
      console.log('currentUser', currentUser)
      return {
        currentUser,
        auth,
        db,
        admin,
        defaultUserClaims
      }
    }
  })

  server.applyMiddleware({ app, path: "/" })

  return app
}



module.exports = spawnServer
