import { renderHook } from '@testing-library/react-hooks'
import { graphql } from 'msw'
import { setupServer } from 'msw/node'
import { ReactNode } from 'react'
import { v4 as uuid } from 'uuid'
import ACUser from '../../models/ACUser'
import TestApolloProvider from '../../providers/TestApolloProvider'
import UserProvider from '../../providers/UserProvider'
import subscriptionBuilder from '../../testUtils/subscriptionBuilder'
import userBuilder from '../../testUtils/userBuilder'
import useUserRedirection, { UseUserRedirectionProps } from '../useUserRedirection'

const server = setupServer()

function mockUserQuery(user?: ACUser) {
  const spy = jest.fn()

  if (user) {
    localStorage.setItem('token', uuid())
  } else {
    localStorage.removeItem('token')
  }

  server.use(
    graphql.query('Me', (req, res, ctx) => {
      spy(req)
      return res(
        ctx.data({
          me: user || null,
        })
      )
    })
  )
  return spy
}

function Providers({ children }: { children: ReactNode | undefined }) {
  return (
    <TestApolloProvider>
      <UserProvider>{children}</UserProvider>
    </TestApolloProvider>
  )
}

const mockUseRouter = {
  replace: jest.fn(),
}
jest.mock('next/router', () => ({
  useRouter: () => mockUseRouter,
}))

describe('useUserRedirection hook', () => {
  beforeAll(() => {
    server.listen()
  })

  afterEach(() => {
    server.resetHandlers()
    jest.clearAllMocks()
  })

  afterAll(() => {
    server.close()
  })

  describe('Using callbacks', () => {
    const onUnauthenticated = jest.fn()
    const onBlocked = jest.fn()
    const onAuthenticated = jest.fn()
    const onSubscribedUser = jest.fn()
    const onSuspended = jest.fn()
    const props: UseUserRedirectionProps = {
      onUnauthenticated,
      onBlocked,
      onAuthenticated,
      onSubscribedUser,
      onSuspended,
    }

    it('Runs unauthenticated callback if user is not logged in', async () => {
      const userQuerySpy = mockUserQuery()

      const { waitFor } = renderHook(() => useUserRedirection(props), {
        wrapper: Providers,
      })

      await waitFor(() => {
        expect(userQuerySpy).toHaveBeenCalledTimes(1)
      })
      expect(onUnauthenticated).toHaveBeenCalledTimes(1)
      expect(onBlocked).not.toHaveBeenCalled()
      expect(onAuthenticated).not.toHaveBeenCalled()
      expect(onSubscribedUser).not.toHaveBeenCalled()
      expect(onSuspended).not.toHaveBeenCalled()
    })

    it('Runs banned callback if user is logged in but has been blocked', async () => {
      const userQuerySpy = mockUserQuery(userBuilder({ traits: 'blocked' }))

      const { waitFor } = renderHook(() => useUserRedirection(props), {
        wrapper: Providers,
      })

      await waitFor(() => {
        expect(userQuerySpy).toHaveBeenCalledTimes(1)
      })
      expect(onUnauthenticated).not.toHaveBeenCalled()
      expect(onBlocked).toHaveBeenCalledTimes(1)
      expect(onAuthenticated).not.toHaveBeenCalled()
      expect(onSubscribedUser).not.toHaveBeenCalled()
      expect(onSuspended).not.toHaveBeenCalled()
    })

    it('Runs suspended callback if user is logged with a disabled subscription', async () => {
      const userQuerySpy = mockUserQuery(userBuilder({ traits: 'withSuspendedSubscription' }))

      const { waitFor } = renderHook(() => useUserRedirection(props), {
        wrapper: Providers,
      })

      await waitFor(() => {
        expect(userQuerySpy).toHaveBeenCalledTimes(1)
      })
      expect(onUnauthenticated).not.toHaveBeenCalled()
      expect(onBlocked).not.toHaveBeenCalled()
      expect(onAuthenticated).not.toHaveBeenCalled()
      expect(onSubscribedUser).not.toHaveBeenCalled()
      expect(onSuspended).toHaveBeenCalledTimes(1)
    })

    it('Runs authenticated callback if user is logged without any subscription', async () => {
      const userQuerySpy = mockUserQuery(userBuilder())

      const { waitFor } = renderHook(() => useUserRedirection(props), {
        wrapper: Providers,
      })

      await waitFor(() => {
        expect(userQuerySpy).toHaveBeenCalledTimes(1)
      })
      expect(onUnauthenticated).not.toHaveBeenCalled()
      expect(onBlocked).not.toHaveBeenCalled()
      expect(onAuthenticated).toHaveBeenCalledTimes(1)
      expect(onSubscribedUser).not.toHaveBeenCalled()
      expect(onSuspended).not.toHaveBeenCalled()
    })

    it('Runs authenticated callback if user is logged with an expired subscription', async () => {
      const userQuerySpy = mockUserQuery(userBuilder({ traits: 'withExpiredSubscription' }))

      const { waitFor } = renderHook(() => useUserRedirection(props), {
        wrapper: Providers,
      })

      await waitFor(() => {
        expect(userQuerySpy).toHaveBeenCalledTimes(1)
      })
      expect(onUnauthenticated).not.toHaveBeenCalled()
      expect(onBlocked).not.toHaveBeenCalled()
      expect(onAuthenticated).toHaveBeenCalledTimes(1)
      expect(onSubscribedUser).not.toHaveBeenCalled()
      expect(onSuspended).not.toHaveBeenCalled()
    })

    it('Runs subscriber callback if user is logged with an active subscription', async () => {
      const dateEnd = new Date()
      dateEnd.setMonth(dateEnd.getMonth() + 1)
      const userQuerySpy = mockUserQuery(userBuilder({ traits: 'withActiveSubscription' }))

      const { waitFor } = renderHook(() => useUserRedirection(props), {
        wrapper: Providers,
      })

      await waitFor(() => {
        expect(userQuerySpy).toHaveBeenCalledTimes(1)
      })
      expect(onUnauthenticated).not.toHaveBeenCalled()
      expect(onBlocked).not.toHaveBeenCalled()
      expect(onAuthenticated).not.toHaveBeenCalled()
      expect(onSubscribedUser).toHaveBeenCalledTimes(1)
      expect(onSuspended).not.toHaveBeenCalled()
    })
  })

  describe('Default callbacks (similar to login context)', () => {
    const mockReplace = mockUseRouter.replace

    it('Redirects to login if user is not logged in', async () => {
      const userQuerySpy = mockUserQuery()

      const { waitFor } = renderHook(() => useUserRedirection(), {
        wrapper: Providers,
      })

      await waitFor(() => {
        expect(userQuerySpy).toHaveBeenCalledTimes(1)
      })

      expect(mockReplace).toHaveBeenCalledTimes(1)
      expect(mockReplace).toHaveBeenCalledWith('/login')
    })

    it('Redirects to home if user is logged in but has been blocked', async () => {
      const userQuerySpy = mockUserQuery(userBuilder({ traits: 'blocked' }))

      const { waitFor } = renderHook(() => useUserRedirection(), {
        wrapper: Providers,
      })

      await waitFor(() => {
        expect(userQuerySpy).toHaveBeenCalledTimes(1)
      })

      expect(mockReplace).toHaveBeenCalledTimes(1)
      expect(mockReplace).toHaveBeenCalledWith('/')
    })

    it('Redirects to home if user is logged with a disabled subscription', async () => {
      const userQuerySpy = mockUserQuery(userBuilder({ traits: 'withSuspendedSubscription' }))

      const { waitFor } = renderHook(() => useUserRedirection(), {
        wrapper: Providers,
      })

      await waitFor(() => {
        expect(userQuerySpy).toHaveBeenCalledTimes(1)
      })

      expect(mockReplace).toHaveBeenCalledTimes(1)
      expect(mockReplace).toHaveBeenCalledWith('/')
    })

    it('Redirects to pricing if user is logged without any subscription', async () => {
      const userQuerySpy = mockUserQuery(userBuilder())

      const { waitFor } = renderHook(() => useUserRedirection(), {
        wrapper: Providers,
      })

      await waitFor(() => {
        expect(userQuerySpy).toHaveBeenCalledTimes(1)
      })

      expect(mockReplace).toHaveBeenCalledTimes(1)
      expect(mockReplace).toHaveBeenCalledWith('/pricing')
    })

    it('Redirects to pricing if user is logged with an expired subscription', async () => {
      const userQuerySpy = mockUserQuery(userBuilder({ traits: 'withExpiredSubscription' }))

      const { waitFor } = renderHook(() => useUserRedirection(), {
        wrapper: Providers,
      })

      await waitFor(() => {
        expect(userQuerySpy).toHaveBeenCalledTimes(1)
      })

      expect(mockReplace).toHaveBeenCalledTimes(1)
      expect(mockReplace).toHaveBeenCalledWith('/pricing')
    })

    it('Redirects to watch if user is logged with an active subscription', async () => {
      const userQuerySpy = mockUserQuery(userBuilder({ traits: 'withActiveSubscription' }))

      const { waitFor } = renderHook(() => useUserRedirection(), {
        wrapper: Providers,
      })

      await waitFor(() => {
        expect(userQuerySpy).toHaveBeenCalledTimes(1)
      })

      expect(mockReplace).toHaveBeenCalledTimes(1)
      expect(mockReplace).toHaveBeenCalledWith('/watch')
    })

    it('Does not do anything if onUnauthenticated is null', async () => {
      const userQuerySpy = mockUserQuery()

      const { waitFor } = renderHook(() => useUserRedirection({ onUnauthenticated: null }), {
        wrapper: Providers,
      })

      await waitFor(() => {
        expect(userQuerySpy).toHaveBeenCalledTimes(1)
      })
      expect(mockReplace).not.toHaveBeenCalled()
    })

    it('Does not do anything if onBlocked is null', async () => {
      const userQuerySpy = mockUserQuery(userBuilder({ traits: 'blocked' }))

      const { waitFor } = renderHook(() => useUserRedirection({ onBlocked: null }), {
        wrapper: Providers,
      })

      await waitFor(() => {
        expect(userQuerySpy).toHaveBeenCalledTimes(1)
      })
      expect(mockReplace).not.toHaveBeenCalled()
    })

    it('Does not do anything if onAuthenticated is null', async () => {
      const userQuerySpy = mockUserQuery(userBuilder())

      const { waitFor } = renderHook(() => useUserRedirection({ onAuthenticated: null }), {
        wrapper: Providers,
      })

      await waitFor(() => {
        expect(userQuerySpy).toHaveBeenCalledTimes(1)
      })
      expect(mockReplace).not.toHaveBeenCalled()
    })

    it('Does not do anything if onSuscribedUser is null', async () => {
      const userQuerySpy = mockUserQuery(userBuilder({ traits: 'withActiveSubscription' }))

      const { waitFor } = renderHook(() => useUserRedirection({ onSubscribedUser: null }), {
        wrapper: Providers,
      })

      await waitFor(() => {
        expect(userQuerySpy).toHaveBeenCalledTimes(1)
      })
      expect(mockReplace).not.toHaveBeenCalled()
    })

    it('Does not do anything if onSuspended is null', async () => {
      const userQuerySpy = mockUserQuery(userBuilder({ traits: 'withSuspendedSubscription' }))

      const { waitFor } = renderHook(() => useUserRedirection({ onSuspended: null }), {
        wrapper: Providers,
      })

      await waitFor(() => {
        expect(userQuerySpy).toHaveBeenCalledTimes(1)
      })
      expect(mockReplace).not.toHaveBeenCalled()
    })
  })

  describe('Manual usage', () => {
    const onUnauthenticated = jest.fn()
    const onBlocked = jest.fn()
    const onAuthenticated = jest.fn()
    const onSubscribedUser = jest.fn()
    const onSuspended = jest.fn()
    const props: UseUserRedirectionProps = {
      onUnauthenticated,
      onBlocked,
      onAuthenticated,
      onSubscribedUser,
      onSuspended,
      auto: false,
    }

    it('Runs unauthenticated callback if user is not logged in', async () => {
      const userQuerySpy = mockUserQuery()

      const { waitFor, result } = renderHook(() => useUserRedirection(props), {
        wrapper: Providers,
      })

      await waitFor(() => {
        expect(userQuerySpy).toHaveBeenCalledTimes(1)
      })

      expect(onUnauthenticated).not.toHaveBeenCalled()

      result.current(undefined)

      expect(onUnauthenticated).toHaveBeenCalledTimes(1)
      expect(onBlocked).not.toHaveBeenCalled()
      expect(onAuthenticated).not.toHaveBeenCalled()
      expect(onSubscribedUser).not.toHaveBeenCalled()
      expect(onSuspended).not.toHaveBeenCalled()
    })

    it('Runs banned callback if user is logged in but has been blocked', async () => {
      const user = userBuilder({ traits: 'blocked' })
      const userQuerySpy = mockUserQuery(user)

      const { waitFor, result } = renderHook(() => useUserRedirection(props), {
        wrapper: Providers,
      })

      await waitFor(() => {
        expect(userQuerySpy).toHaveBeenCalledTimes(1)
      })

      expect(onBlocked).not.toHaveBeenCalled()

      result.current({ user })

      expect(onUnauthenticated).not.toHaveBeenCalled()
      expect(onBlocked).toHaveBeenCalledTimes(1)
      expect(onAuthenticated).not.toHaveBeenCalled()
      expect(onSubscribedUser).not.toHaveBeenCalled()
      expect(onSuspended).not.toHaveBeenCalled()
    })

    it('Runs suspended callback if user is logged with a disabled subscription', async () => {
      const user = userBuilder({ traits: 'withSuspendedSubscription' })
      const userQuerySpy = mockUserQuery(user)

      const { waitFor, result } = renderHook(() => useUserRedirection(props), {
        wrapper: Providers,
      })

      await waitFor(() => {
        expect(userQuerySpy).toHaveBeenCalledTimes(1)
      })

      expect(onSuspended).not.toHaveBeenCalled()

      result.current({ user })

      expect(onUnauthenticated).not.toHaveBeenCalled()
      expect(onBlocked).not.toHaveBeenCalled()
      expect(onAuthenticated).not.toHaveBeenCalled()
      expect(onSubscribedUser).not.toHaveBeenCalled()
      expect(onSuspended).toHaveBeenCalledTimes(1)
    })

    it('Runs authenticated callback if user is logged without any subscription', async () => {
      const user = userBuilder()
      const userQuerySpy = mockUserQuery(user)

      const { waitFor, result } = renderHook(() => useUserRedirection(props), {
        wrapper: Providers,
      })

      await waitFor(() => {
        expect(userQuerySpy).toHaveBeenCalledTimes(1)
      })

      expect(onAuthenticated).not.toHaveBeenCalled()

      result.current({ user })

      expect(onUnauthenticated).not.toHaveBeenCalled()
      expect(onBlocked).not.toHaveBeenCalled()
      expect(onAuthenticated).toHaveBeenCalledTimes(1)
      expect(onSubscribedUser).not.toHaveBeenCalled()
      expect(onSuspended).not.toHaveBeenCalled()
    })

    it('Runs authenticated callback if user is logged with an expired subscription', async () => {
      const user = userBuilder({ traits: 'withExpiredSubscription' })
      const userQuerySpy = mockUserQuery(user)

      const { waitFor, result } = renderHook(() => useUserRedirection(props), {
        wrapper: Providers,
      })

      await waitFor(() => {
        expect(userQuerySpy).toHaveBeenCalledTimes(1)
      })

      expect(onAuthenticated).not.toHaveBeenCalled()

      result.current({ user })

      expect(onUnauthenticated).not.toHaveBeenCalled()
      expect(onBlocked).not.toHaveBeenCalled()
      expect(onAuthenticated).toHaveBeenCalledTimes(1)
      expect(onSubscribedUser).not.toHaveBeenCalled()
      expect(onSuspended).not.toHaveBeenCalled()
    })

    it('Runs subscriber callback if user is logged with an active subscription', async () => {
      const user = userBuilder({ traits: 'withActiveSubscription' })
      const userQuerySpy = mockUserQuery(user)

      const { waitFor, result } = renderHook(() => useUserRedirection(props), {
        wrapper: Providers,
      })

      await waitFor(() => {
        expect(userQuerySpy).toHaveBeenCalledTimes(1)
      })

      expect(onSubscribedUser).not.toHaveBeenCalled()

      result.current({ user })

      expect(onUnauthenticated).not.toHaveBeenCalled()
      expect(onBlocked).not.toHaveBeenCalled()
      expect(onAuthenticated).not.toHaveBeenCalled()
      expect(onSubscribedUser).toHaveBeenCalledTimes(1)
      expect(onSuspended).not.toHaveBeenCalled()
    })

    it('Runs custom unauthenticated callback', async () => {
      const userQuerySpy = mockUserQuery()
      const customCallback = jest.fn()

      const { waitFor, result } = renderHook(() => useUserRedirection(props), {
        wrapper: Providers,
      })

      await waitFor(() => {
        expect(userQuerySpy).toHaveBeenCalledTimes(1)
      })

      result.current({ onUnauthenticated: customCallback })

      expect(onUnauthenticated).not.toHaveBeenCalled()
      expect(customCallback).toHaveBeenCalledTimes(1)
    })

    it('Runs custom banned callback', async () => {
      const user = userBuilder({ traits: 'blocked' })
      const userQuerySpy = mockUserQuery(user)
      const customCallback = jest.fn()

      const { waitFor, result } = renderHook(() => useUserRedirection(props), {
        wrapper: Providers,
      })

      await waitFor(() => {
        expect(userQuerySpy).toHaveBeenCalledTimes(1)
      })

      result.current({ user, onBlocked: customCallback })

      expect(onBlocked).not.toHaveBeenCalled()
      expect(customCallback).toHaveBeenCalledTimes(1)
    })

    it('Runs custom suspended callback', async () => {
      const user = userBuilder({ traits: 'withSuspendedSubscription' })
      const userQuerySpy = mockUserQuery(user)
      const customCallback = jest.fn()

      const { waitFor, result } = renderHook(() => useUserRedirection(props), {
        wrapper: Providers,
      })

      await waitFor(() => {
        expect(userQuerySpy).toHaveBeenCalledTimes(1)
      })

      result.current({ user, onSuspended: customCallback })

      expect(onSuspended).not.toHaveBeenCalled()
      expect(customCallback).toHaveBeenCalledTimes(1)
    })

    it('Runs custom authenticated callback', async () => {
      const user = userBuilder()
      const userQuerySpy = mockUserQuery(user)
      const customCallback = jest.fn()

      const { waitFor, result } = renderHook(() => useUserRedirection(props), {
        wrapper: Providers,
      })

      await waitFor(() => {
        expect(userQuerySpy).toHaveBeenCalledTimes(1)
      })

      result.current({ user, onAuthenticated: customCallback })

      expect(onAuthenticated).not.toHaveBeenCalled()
      expect(customCallback).toHaveBeenCalledTimes(1)
    })

    it('Runs custom authenticated callback', async () => {
      const user = userBuilder({ traits: 'withExpiredSubscription' })
      const userQuerySpy = mockUserQuery(user)
      const customCallback = jest.fn()

      const { waitFor, result } = renderHook(() => useUserRedirection(props), {
        wrapper: Providers,
      })

      await waitFor(() => {
        expect(userQuerySpy).toHaveBeenCalledTimes(1)
      })

      result.current({ user, onAuthenticated: customCallback })

      expect(onAuthenticated).not.toHaveBeenCalled()
      expect(customCallback).toHaveBeenCalledTimes(1)
    })

    it('Runs custom subscriber callback', async () => {
      const user = userBuilder({ traits: 'withActiveSubscription' })
      const userQuerySpy = mockUserQuery(user)
      const customCallback = jest.fn()

      const { waitFor, result } = renderHook(() => useUserRedirection(props), {
        wrapper: Providers,
      })

      await waitFor(() => {
        expect(userQuerySpy).toHaveBeenCalledTimes(1)
      })

      result.current({ user, onSubscribedUser: customCallback })

      expect(onSubscribedUser).not.toHaveBeenCalled()
      expect(customCallback).toHaveBeenCalledTimes(1)
    })
  })
})
