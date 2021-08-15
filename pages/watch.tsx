/* eslint-disable @next/next/no-img-element */
import { useQuery, gql } from '@apollo/client'
import Link from 'next/link'
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
