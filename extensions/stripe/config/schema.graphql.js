const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = {
  definition: `
    input FindCustomerInput {
      email: String!
    }

    type StripeCustomer {
      email: String
    }
  `,
  query: ``,
  mutation: `
    findCustomer(input: FindCustomerInput!): StripeCustomer
  `,
  type: {},
  resolver: {
    Query: {},
    Mutation: {
      findCustomer: {
        description: "Creates or gets a customer",
        resolverOf: "application::subscription.subscription.create",
        resolver: async (_, { input: { email } }) => {
          // const customer = await stripe.customers.create({
          //   email,
          // });

          return {
            email: "test",
          };
        },
      },
    },
  },
};
