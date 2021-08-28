import { gql, useQuery } from '@apollo/client'
import { useRouter } from 'next/router'
import ErrorMessage from '../../components/ErrorMessage'
import VdoCipherVideo from '../../components/VdoCipherVideo'
import useUserRedirection from '../../hooks/useUserRedirection'
import styles from './[code].module.css'

const GET_VIDEO_BY_CODE = gql`
  query GetWorkoutVideo($id: ID!) {
    workoutVideo(id: $id) {
      title
      otp
      playbackInfo
    }
  }
`

export interface PremiumVideo {
  title: string
  otp: string
  playbackInfo: string
}

export interface WatchVideoParams {
  code: string
}

export default function WatchVideo() {
  const { query } = useRouter()

  useUserRedirection({
    onUnauthenticated: ({ replace }) => replace('/login'),
    onAuthenticated: ({ replace }) => replace('/pricing'),
    onBlocked: ({ replace }) => replace('/?blocked=true'),
    onSuspended: ({ replace }) => replace('/?suspended=true'),
    onSubscribedUser: null,
  })

  const { data, error } = useQuery<{ workoutVideo: PremiumVideo }>(GET_VIDEO_BY_CODE, {
    variables: { id: query.code },
    skip: query.code ? false : true,
  })

  const video = data?.workoutVideo

  return (
    <div>
      {video ? (
        <div className={styles.content}>
          <h1 className={styles.title}>{video.title}</h1>
          <VdoCipherVideo {...video} />
        </div>
      ) : null}
      {error && <ErrorMessage>Une erreur serveur est survenue.</ErrorMessage>}
    </div>
  )
}
