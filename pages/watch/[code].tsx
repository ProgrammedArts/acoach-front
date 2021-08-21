import { useQuery, gql } from '@apollo/client'
import { useRouter } from 'next/router'
import { useCallback, useEffect } from 'react'
import VdoCipherVideo from '../../components/VdoCipherVideo'
import useUser from '../../hooks/useUser'
import { UserState } from '../../providers/UserProvider'
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
  const { query, push } = useRouter()

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

  const { data } = useQuery<{ workoutVideo: PremiumVideo }>(GET_VIDEO_BY_CODE, {
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
    </div>
  )
}
