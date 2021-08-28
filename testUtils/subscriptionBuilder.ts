import { build, fake } from '@jackfranklin/test-data-bot'
import ACSubscription from '../models/ACSubscription'

const subscriptionBuilder = build<ACSubscription>('Subscription', {
  fields: {
    name: fake((faker) => faker.name.findName()),
    stripeProductId: fake((faker) => `prod_${faker.random.alphaNumeric(15)}`),
    description: fake((faker) => faker.lorem.sentence()),
    fullAccess: fake(() => false),
  },
})

export default subscriptionBuilder
