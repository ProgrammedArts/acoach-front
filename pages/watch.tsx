/* eslint-disable @next/next/no-img-element */
import { gql, useQuery } from '@apollo/client'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useCallback, useEffect } from 'react'
import useUser from '../hooks/useUser'
import { UserState } from '../providers/UserProvider'
import styles from './watch.module.scss'

const GET_VIDEOS = gql`
  {
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
  const { data } = useQuery<{ workoutVideos: WorkoutVideo[] }>(GET_VIDEOS)

  const { push } = useRouter()
  const { me, isLoggedIn } = useUser()

  const redirectAuthenticatedUser = useCallback(
    function redirectAuthenticatedUser(user: UserState) {
      const { subscription, subscriptionActive, subscriptionEnd, blocked } = user

      if (
        blocked ||
        (subscription &&
          subscriptionEnd &&
          new Date(subscriptionEnd).getTime() > Date.now() &&
          !subscriptionActive)
      ) {
        // is blocked or has his/her subscription terminated manually
        push('/banned')
      } else if (
        !blocked &&
        (!subscription ||
          (subscription && subscriptionEnd && new Date(subscriptionEnd).getTime() < Date.now()))
      ) {
        // no active subscription or subscription expired
        push('/pricing')
      }
    },
    [push]
  )

  useEffect(() => {
    if (isLoggedIn() && me) {
      redirectAuthenticatedUser(me)
    } else if (!isLoggedIn()) {
      push('/pricing')
    }
  }, [me, isLoggedIn, push, redirectAuthenticatedUser])

  return (
    <div className={styles.Watch}>
      {data
        ? data.workoutVideos.map(({ id, title, thumbnailURL }) => (
            <div className={styles.videoPreview} key={id}>
              <img src={thumbnailURL} alt={title} />
              <Link href={`/watch/${id}`}>{title}</Link>
            </div>
          ))
        : null}
    </div>
  )
}
