import { useQuery, gql } from "@apollo/client";
import Link from "next/link";

const GET_VIDEOS = gql`
  {
    premiumVideos {
      title
      code
    }
  }
`;

export interface PremiumVideo {
  title: string;
  code: string;
}

export default function Watch() {
  const { data } = useQuery<{ premiumVideos: PremiumVideo[] }>(GET_VIDEOS);

  return (
    <div>
      {data ? (
        <ul>
          {data.premiumVideos.map(({ code, title }) => (
            <li key={code}>
              <Link href={`/watch/${code}`}>{title}</Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
