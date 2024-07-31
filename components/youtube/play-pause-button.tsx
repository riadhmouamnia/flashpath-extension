import { CiPlay1, CiPause1 } from "react-icons/ci";
import { Button } from "../ui/button";

type PlayPauseProps = {
  isPlaying: boolean;
  handlePlayPause: () => void;
};

export default function PlayPause({
  isPlaying,
  handlePlayPause,
}: PlayPauseProps) {
  return (
    <>
      <Button variant="ghost" title="Share" onClick={handlePlayPause}>
        {isPlaying ? (
          <CiPause1 className="text-xl" />
        ) : (
          <CiPlay1 className="text-xl" />
        )}
      </Button>
    </>
  );
}
