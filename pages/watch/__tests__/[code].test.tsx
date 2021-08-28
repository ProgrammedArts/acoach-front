import { render, screen, waitFor } from '@testing-library/react'
import faker from 'faker/locale/fr'
import { graphql } from 'msw'
import { setupServer } from 'msw/node'
import { NextRouter } from 'next/router'
import { ReactNode } from 'react'
import { v4 as uuid } from 'uuid'
import ACUser from '../../../models/ACUser'
import TestApolloProvider from '../../../providers/TestApolloProvider'
import UserProvider from '../../../providers/UserProvider'
import userBuilder from '../../../testUtils/userBuilder'
import WatchVideo from '../[code]'

const mockUseRouter: Partial<NextRouter> = {
  replace: jest.fn(),
  query: {
    code: '1',
  },
}
jest.mock('next/router', () => ({
  useRouter: () => mockUseRouter,
}))

const title = 'Workout video'
const otp = faker.random.alphaNumeric(10)
const playbackInfo = faker.random.alphaNumeric(20)

const server = setupServer(
  graphql.query('GetWorkoutVideo', (_, res, ctx) =>
    res(
      ctx.data({
        workoutVideo: {
          title,
          otp,
          playbackInfo,
        },
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

function mockGetWorkoutVideoError() {
  server.use(graphql.query('GetWorkoutVideo', (_, res, ctx) => res(ctx.errors([{}]))))
}

function Providers({ children }: { children?: ReactNode | undefined }) {
  return (
    <TestApolloProvider>
      <UserProvider>{children}</UserProvider>
    </TestApolloProvider>
  )
}

describe('Watch video page', () => {
  const mockReplace = mockUseRouter.replace as jest.Mock
  const vdoAdd = jest.fn()

  beforeAll(() => {
    server.listen()
  })

  beforeEach(() => {
    // add a script to properly load VdoCipher scripts
    const firstScript = document.createElement('script')
    firstScript.setAttribute('data-testid', 'bundle')
    document.body.appendChild(firstScript)
    window.vdo = {
      add: vdoAdd,
      d: [],
    }
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
    render(<WatchVideo />, { wrapper: Providers })

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalled()
    })
    expect(mockReplace).toHaveBeenCalledWith('/login')
  })

  it('Redirects to pricing if authenticated', async () => {
    mockUserQuery(userBuilder())
    render(<WatchVideo />, { wrapper: Providers })

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalled()
    })
    expect(mockReplace).toHaveBeenCalledWith('/pricing')
  })

  it('Redirects to home if blocked', async () => {
    mockUserQuery(userBuilder({ traits: 'blocked' }))
    render(<WatchVideo />, { wrapper: Providers })

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalled()
    })
    expect(mockReplace).toHaveBeenCalledWith('/?blocked=true')
  })

  it('Redirects to home if suspended', async () => {
    mockUserQuery(userBuilder({ traits: 'withSuspendedSubscription' }))
    render(<WatchVideo />, { wrapper: Providers })

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalled()
    })
    expect(mockReplace).toHaveBeenCalledWith('/?suspended=true')
  })

  it('Shows the video to subscribed users', async () => {
    mockUserQuery(userBuilder({ traits: 'withActiveSubscription' }))
    render(<WatchVideo />, { wrapper: Providers })

    const videoTitle = await screen.findByText(/workout video/i)
    expect(videoTitle).toBeInTheDocument()

    const vdoJsScript = document.getElementsByTagName('script').item(0)
    expect(vdoJsScript?.getAttribute('src')).toEqual(
      'https://player.vdocipher.com/playerAssets/1.6.10/vdo.js'
    )

    const vdoCipherDiv = screen.getByTestId('vdocipher')
    expect(vdoCipherDiv).toBeInTheDocument()

    expect(vdoAdd).toHaveBeenCalledTimes(1)
    const [call] = vdoAdd.mock.calls[0]
    expect(call.otp).toEqual(otp)
    expect(call.playbackInfo).toEqual(playbackInfo)
    expect(call.container).toBe(vdoCipherDiv)
  })

  it('Shows an error message if the video failed to fetch', async () => {
    mockGetWorkoutVideoError()
    mockUserQuery(userBuilder({ traits: 'withActiveSubscription' }))
    render(<WatchVideo />, { wrapper: Providers })

    const errorMessage = await screen.findByText(/une erreur serveur est survenue/i)
    expect(errorMessage).toBeInTheDocument()
  })
})
