import { NextRouter, useRouter } from 'next/router'
import { useCallback, useEffect } from 'react'
import ACUser from '../models/ACUser'
import useUser from './useUser'

export type UserRedirectionCallback = ((router: NextRouter) => void) | null

export interface UseUserRedirectionProps {
  onUnauthenticated?: UserRedirectionCallback
  onBlocked?: UserRedirectionCallback
  onSuspended?: UserRedirectionCallback
  onAuthenticated?: UserRedirectionCallback
  onSubscribedUser?: UserRedirectionCallback
  auto?: boolean
}

export default function useUserRedirection(
  {
    onUnauthenticated,
    onBlocked,
    onSuspended,
    onAuthenticated,
    onSubscribedUser,
    auto,
  }: UseUserRedirectionProps = { auto: true }
) {
  const { me, isLoggedIn } = useUser()
  const router = useRouter()

  const callbackHandler = useCallback(
    (callback?: UserRedirectionCallback, defaultCallback?: UserRedirectionCallback) => {
      if (!callback) {
        if (callback !== null && defaultCallback) {
          defaultCallback(router)
        }
        return
      }
      return callback(router)
    },
    [router]
  )

  const unauthenticatedCallback = useCallback(
    () => callbackHandler(onUnauthenticated, ({ replace }) => replace('/login')),
    [callbackHandler, onUnauthenticated]
  )

  const blockedCallback = useCallback(
    () => callbackHandler(onBlocked, ({ replace }) => replace('/?blocked=true')),
    [callbackHandler, onBlocked]
  )

  const suspendedCallback = useCallback(
    () => callbackHandler(onSuspended, ({ replace }) => replace('/?suspended=true')),
    [callbackHandler, onSuspended]
  )

  const authenticatedCallback = useCallback(
    () => callbackHandler(onAuthenticated, ({ replace }) => replace('/pricing')),
    [callbackHandler, onAuthenticated]
  )

  const subscriberCallback = useCallback(
    () => callbackHandler(onSubscribedUser, ({ replace }) => replace('/watch')),
    [callbackHandler, onSubscribedUser]
  )

  const redirectUser = useCallback(
    (options?: { user?: ACUser } & Omit<UseUserRedirectionProps, 'auto'>) => {
      const user = options?.user || me
      if (!isLoggedIn()) {
        callbackHandler(options?.onUnauthenticated, unauthenticatedCallback)
      } else if (isLoggedIn() && user) {
        if (user.blocked) {
          callbackHandler(options?.onBlocked, blockedCallback)
        } else if (
          !user.blocked &&
          user.subscription &&
          user.subscriptionEnd &&
          new Date(user.subscriptionEnd).getTime() >= Date.now() &&
          !user.subscriptionActive
        ) {
          callbackHandler(options?.onSuspended, suspendedCallback)
        } else if (
          !user.blocked &&
          ((!user.subscription && !user.subscriptionEnd) ||
            (user.subscription &&
              user.subscriptionEnd &&
              new Date(user.subscriptionEnd).getTime() < Date.now() &&
              user.subscriptionActive))
        ) {
          callbackHandler(options?.onAuthenticated, authenticatedCallback)
        } else if (
          !user.blocked &&
          user.subscription &&
          user.subscriptionEnd &&
          new Date(user.subscriptionEnd).getTime() >= Date.now() &&
          user.subscriptionActive
        ) {
          callbackHandler(options?.onSubscribedUser, subscriberCallback)
        }
      }
    },
    [
      authenticatedCallback,
      blockedCallback,
      callbackHandler,
      isLoggedIn,
      me,
      subscriberCallback,
      suspendedCallback,
      unauthenticatedCallback,
    ]
  )

  useEffect(() => {
    if (auto !== false) {
      redirectUser()
    }
  }, [auto, redirectUser])

  return redirectUser
}
