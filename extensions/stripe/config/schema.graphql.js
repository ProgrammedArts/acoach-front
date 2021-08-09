"use strict";
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = {
  definition: `
    type CheckoutSession {
      url: String
    }

    input CreateCheckoutInput {
      subscriptionId: ID!
    }
  `,
  query: ``,
  mutation: `
    createCheckout(input: CreateCheckoutInput): CheckoutSession
  `,
  type: {},
  resolver: {
    Query: {},
    Mutation: {
      createCheckout: {
        description: "Creates a checkout session",
        resolverOf: "application::subscription.subscription.create",
        resolver: async (_, { input: { subscriptionId } }, { context }) => {
          const { user } = context.state;

          const subscription = await strapi.services.subscription.findOne({
            id: subscriptionId,
          });

          if (subscription && user) {
            // create a stripe customer and update the user with it
            if (!user.stripeCustomerId) {
              const customer = await stripe.customers.create({
                email: user.email,
                name: user.realname,
                preferred_locales: ["fr-FR"],
              });

              // add stripe customer id
              user.stripeCustomerId = customer.id;

              // do not update password
              delete user.password;

              // update user
              await strapi.plugins["users-permissions"].services.user.edit(
                { id: user.id },
                user
              );
            }

            const [price] = (
              await stripe.prices.list({
                product: subscription.stripeProductId,
              })
            ).data;

            const session = await stripe.checkout.sessions.create({
              mode: "subscription",
              payment_method_types: ["card"],
              line_items: [
                {
                  price: price.id,
                  // For metered billing, do not pass quantity
                  quantity: 1,
                },
              ],
              success_url: `${process.env.SITE_HOST}/success?session_id={CHECKOUT_SESSION_ID}`,
              cancel_url: `${process.env.SITE_HOST}/canceled`,
              locale: "fr",
              customer: user.stripeCustomerId,
            });

            return {
              url: session.url,
            };
          }

          return {};
        },
      },
    },
  },
};
