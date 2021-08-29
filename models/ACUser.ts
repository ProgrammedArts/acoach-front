import ACSubscription from './ACSubscription'

export default interface ACUser {
  username: string
  email: string
  provider: 'local'
  password: string
  confirmed: boolean
  blocked: boolean | null
  realname: string
  stripeCustomerId: string | null
  subscriptionStart: string | null
  subscriptionEnd: string | null
  subscriptionActive: boolean | null
  subscription: ACSubscription | null
}
