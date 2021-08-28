import { render, screen, waitFor, getByText } from '@testing-library/react'
import faker from 'faker/locale/fr'
import { graphql } from 'msw'
import { setupServer } from 'msw/node'
import { NextRouter } from 'next/router'
import { ReactNode } from 'react'
import { v4 as uuid } from 'uuid'
import ACUser from '../../models/ACUser'
import TestApolloProvider from '../../providers/TestApolloProvider'
import UserProvider from '../../providers/UserProvider'
import userBuilder from '../../testUtils/userBuilder'
import Watch from '../watch'
import isURL from 'validator/lib/isURL'

const mockUseRouter: Partial<NextRouter> = {
  replace: jest.fn(),
}
jest.mock('next/router', () => ({
  useRouter: () => mockUseRouter,
}))

const server = setupServer(
  graphql.query('GetWorkoutVideos', (req, res, ctx) =>
    res(
      ctx.data({
        workoutVideos: [
          {
            id: 1,
            title: 'Workout 1',
            thumbnailURL: faker.internet.url(),
          },
          {
            id: 2,
            title: 'Workout 2',
            thumbnailURL: faker.internet.url(),
          },
          {
            id: 3,
            title: 'Workout 3',
            thumbnailURL: faker.internet.url(),
          },
        ],
      })
    )
  )
)

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

function mockGetWorkoutVideosError() {
  server.use(graphql.query('GetWorkoutVideos', (req, res, ctx) => res(ctx.errors([{}]))))
}

function Providers({ children }: { children?: ReactNode | undefined }) {
  return (
    <TestApolloProvider>
      <UserProvider>{children}</UserProvider>
    </TestApolloProvider>
  )
}

describe('Watching list page', () => {
  const mockReplace = mockUseRouter.replace as jest.Mock

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

  it('Redirects to login if unauthenticated', async () => {
    mockUserQuery()
    render(<Watch />, { wrapper: Providers })

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalled()
    })
    expect(mockReplace).toHaveBeenCalledWith('/login')
  })

  it('Redirects to pricing if authenticated', async () => {
    mockUserQuery(userBuilder())
    render(<Watch />, { wrapper: Providers })

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalled()
    })
    expect(mockReplace).toHaveBeenCalledWith('/pricing')
  })

  it('Redirects to home if blocked', async () => {
    mockUserQuery(userBuilder({ traits: 'blocked' }))
    render(<Watch />, { wrapper: Providers })

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalled()
    })
    expect(mockReplace).toHaveBeenCalledWith('/?blocked=true')
  })

  it('Redirects to home if suspended', async () => {
    mockUserQuery(userBuilder({ traits: 'withSuspendedSubscription' }))
    render(<Watch />, { wrapper: Providers })

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalled()
    })
    expect(mockReplace).toHaveBeenCalledWith('/?suspended=true')
  })

  it('Shows links to workout videos to subscribed users', async () => {
    mockUserQuery(userBuilder({ traits: 'withActiveSubscription' }))
    render(<Watch />, { wrapper: Providers })

    const [preview1, preview2, preview3] = await screen.findAllByTestId('preview')

    // titles
    getByText(preview1, 'Workout 1')
    getByText(preview2, 'Workout 2')
    getByText(preview3, 'Workout 3')
    // thumbnails
    expect(isURL(preview1.querySelector('img')?.getAttribute('src') || '')).toBeTruthy()
    expect(isURL(preview2.querySelector('img')?.getAttribute('src') || '')).toBeTruthy()
    expect(isURL(preview3.querySelector('img')?.getAttribute('src') || '')).toBeTruthy()
    // links
    expect(preview1.querySelector('a')?.getAttribute('href')).toEqual('/watch/1')
    expect(preview2.querySelector('a')?.getAttribute('href')).toEqual('/watch/2')
    expect(preview3.querySelector('a')?.getAttribute('href')).toEqual('/watch/3')
  })

  it('Shows an error message if video fetch failed', async () => {
    mockGetWorkoutVideosError()
    mockUserQuery(userBuilder({ traits: 'withActiveSubscription' }))
    render(<Watch />, { wrapper: Providers })

    const errorMessage = await screen.findByText(/une erreur serveur est survenue/i)
    expect(errorMessage).toBeInTheDocument()
    expect(screen.queryAllByTestId('preview')).toHaveLength(0)
  })
})
