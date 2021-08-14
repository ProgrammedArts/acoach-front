import { useQuery, gql } from "@apollo/client";
import Link from "next/link";

const GET_VIDEOS = gql`
  {
    workoutVideos {
      title
      code
    }
  }
`;

export interface WorkoutVideo {
  title: string;
  code: string;
}

export default function Watch() {
  const { data } = useQuery<{ workoutVideos: WorkoutVideo[] }>(GET_VIDEOS);

  return (
    <div>
      {data ? (
        <ul>
          {data.workoutVideos.map(({ code, title }) => (
            <li key={code}>
              <Link href={`/watch/${code}`}>{title}</Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
