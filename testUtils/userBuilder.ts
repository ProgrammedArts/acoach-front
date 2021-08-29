import { build, fake } from '@jackfranklin/test-data-bot'
import faker from 'faker/locale/fr'
import ACUser from '../models/ACUser'
import subscriptionBuilder from './subscriptionBuilder'

const userBuilder = build<ACUser>('User', {
  fields: {
    username: '',
    email: fake(() => faker.internet.email()),
    provider: 'local',
    password: fake(() => faker.internet.password()),
    confirmed: fake(() => true),
    blocked: null,
    realname: fake(() => faker.name.firstName()),
    stripeCustomerId: null,
    subscriptionStart: null,
    subscriptionEnd: null,
    subscriptionActive: null,
    subscription: null,
  },
  postBuild: (user: ACUser): ACUser => ({
    ...user,
    username: user.email.toLowerCase(),
    email: user.email.toLowerCase(),
  }),
  traits: {
    blocked: {
      overrides: {
        blocked: fake(() => true),
      },
    },
    withActiveSubscription: {
      postBuild: (user: ACUser): ACUser => {
        const startDate = new Date()
        const endDate = new Date()
        endDate.setMonth(endDate.getMonth() + 1)
        const subscription = subscriptionBuilder()

        return {
          ...user,
          subscription,
          subscriptionActive: true,
          subscriptionEnd: endDate.toISOString(),
          subscriptionStart: startDate.toISOString(),
        }
      },
    },
    withExpiredSubscription: {
      postBuild: (user: ACUser): ACUser => {
        const startDate = new Date()
        startDate.setMonth(startDate.getMonth() - 1)
        const endDate = new Date()
        endDate.setDate(endDate.getDate() - 1)
        const subscription = subscriptionBuilder()

        return {
          ...user,
          subscription,
          subscriptionActive: true,
          subscriptionEnd: endDate.toISOString(),
          subscriptionStart: startDate.toISOString(),
        }
      },
    },
    withSuspendedSubscription: {
      postBuild: (user: ACUser): ACUser => {
        const startDate = new Date()
        const endDate = new Date()
        endDate.setMonth(endDate.getMonth() + 1)
        const subscription = subscriptionBuilder()

        return {
          ...user,
          subscription,
          subscriptionActive: false,
          subscriptionEnd: endDate.toISOString(),
          subscriptionStart: startDate.toISOString(),
        }
      },
    },
  },
})

export default userBuilder
