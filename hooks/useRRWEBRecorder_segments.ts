import { useEffect, useState } from "react";
import RRWEBRecorder from "@/lib/RRWEBRecorder";

function useRRWEBRecorder({ pageId }: { pageId?: number }) {
  const [recorder, setRecorder] = useState<RRWEBRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  console.log(isRecording);

  useEffect(() => {
    if (!pageId) {
      return;
    }

    const rrwebRecorder = new RRWEBRecorder({
      pageId,
    });
    window.addEventListener("beforeunload", rrwebRecorder.saveBeforeUnload);

    setRecorder(rrwebRecorder);

    // Load any previously saved recording state
    rrwebRecorder.loadRecordingState().then(() => {
      setIsRecording(rrwebRecorder.getIsRecording());
    });

    return () => {
      window.removeEventListener(
        "beforeunload",
        rrwebRecorder.saveBeforeUnload
      );
      rrwebRecorder.stopRecording(); // Cleanup on component unmount
    };
  }, []);

  const handleStart = () => {
    if (recorder) {
      // recorder.startRecording();
      recorder.startRecording();
      setIsRecording(true);
    }
  };

  const handleStop = () => {
    if (recorder) {
      // recorder.stopRecording();
      recorder.stopRecording();
      setIsRecording(false);
    }
  };

  return {
    startRecording: handleStart,
    stopRecording: handleStop,
    isRecording,
  };
}

export default useRRWEBRecorder;
