import { useQuery, gql } from "@apollo/client";
import { useRouter } from "next/router";
import styles from "./[code].module.css";

const GET_VIDEO_BY_CODE = gql`
  query GetPremiumVideoByCode($code: String!) {
    premiumVideos(where: { code: $code }) {
      title
      code
    }
  }
`;

export interface PremiumVideo {
  title: string;
  code: string;
}

export interface WatchVideoParams {
  code: string;
}

export default function WatchVideo() {
  const { query } = useRouter();

  const { data } = useQuery<{ premiumVideos: PremiumVideo[] }>(
    GET_VIDEO_BY_CODE,
    {
      variables: { code: query.code },
    }
  );

  const video = data?.premiumVideos[0];

  return (
    <div>
      {video ? (
        <div className={styles.content}>
          <h1 className={styles.title}>{video.title}</h1>
          <iframe
            className={styles.video}
            src={`https://www.cincopa.com/media-platform/iframe.aspx?fid=${video.code}`}
            frameBorder="0"
            allowFullScreen
            scrolling="no"
            allow="autoplay; fullscreen"
          ></iframe>
        </div>
      ) : null}
    </div>
  );
}
