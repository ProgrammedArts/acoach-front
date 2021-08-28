/* eslint-disable @next/next/no-img-element */
import { gql, useQuery } from '@apollo/client'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useCallback, useEffect } from 'react'
import ErrorMessage from '../components/ErrorMessage'
import useUser from '../hooks/useUser'
import useUserRedirection from '../hooks/useUserRedirection'
import { UserState } from '../providers/UserProvider'
import styles from './watch.module.scss'

const GET_VIDEOS = gql`
  query GetWorkoutVideos {
    workoutVideos {
      id
      title
      thumbnailURL
    }
  }
`

export interface WorkoutVideo {
  title: string
  id: string
  thumbnailURL: string
}

export default function Watch() {
  const { data, error } = useQuery<{ workoutVideos: WorkoutVideo[] }>(GET_VIDEOS)

  useUserRedirection({
    onUnauthenticated: ({ replace }) => replace('/login'),
    onAuthenticated: ({ replace }) => replace('/pricing'),
    onBlocked: ({ replace }) => replace('/?blocked=true'),
    onSuspended: ({ replace }) => replace('/?suspended=true'),
    onSubscribedUser: null,
  })

  return (
    <div className={styles.Watch}>
      {data
        ? data.workoutVideos.map(({ id, title, thumbnailURL }) => (
            <div className={styles.videoPreview} key={id} data-testid="preview">
              <img src={thumbnailURL} alt={title} />
              <Link href={`/watch/${id}`}>{title}</Link>
            </div>
          ))
        : null}
      {error && <ErrorMessage>Une erreur serveur est survenue.</ErrorMessage>}
    </div>
  )
}
