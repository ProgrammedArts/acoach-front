import { ApolloError } from '@apollo/client'

export interface StrapiGQLError {
  id: string
  message: string
}

export default function getStrapGQLError(error: ApolloError): StrapiGQLError | undefined {
  return error.graphQLErrors[0]?.extensions?.exception.data?.message[0].messages[0]
}
