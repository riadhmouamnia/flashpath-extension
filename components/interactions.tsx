/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card } from "@/components/ui/card";
import useRRWEBRecorder from "@/hooks/useRRWEBRecorder";
// import useTrackInteractions from "@/hooks/useTrackInteractionsV4";
// import useTrackInteractionWithReducer from "@/hooks/useTrackInteractionWithReducer2";
import usePageInteractions from "@/hooks/usePageInteractions";
import { JSONTree } from "react-json-tree";
import { Button } from "./ui/button";

const theme = {
  scheme: "monokai",
  author: "wimer hazenberg (http://www.monokai.nl)",
  base00: "#272822",
  base01: "#383830",
  base02: "#49483e",
  base03: "#75715e",
  base04: "#a59f85",
  base05: "#f8f8f2",
  base06: "#f5f4f1",
  base07: "#f9f8f5",
  base08: "#f92672",
  base09: "#fd971f",
  base0A: "#f4bf75",
  base0B: "#a6e22e",
  base0C: "#a1efe4",
  base0D: "#66d9ef",
  base0E: "#ae81ff",
  base0F: "#cc6633",
};

export default function Interactions({
  tabUrl,
  pageId,
  networkAvailable,
  pageKey,
}: {
  tabUrl: string;
  pageId: number;
  networkAvailable: boolean;
  pageKey: string;
}) {
  // const { urlInteractions } = useTrackInteractionWithReducer({
  //   tabUrl,
  //   pageId,
  //   networkAvailable,
  //   pageKey,
  // });
  const { isRecording, startRecording, stopRecording } =
    useRRWEBRecorder(pageId);
  const { urlInteractions } = usePageInteractions({ tabUrl, pageId });

  return (
    <>
      <div className="flex gap-2 items-center">
        Online:{" "}
        {networkAvailable ? (
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        ) : (
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
        )}
      </div>
      <div className="flex gap-2 items-center">
        Recording:{" "}
        {isRecording ? (
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        ) : (
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
        )}
      </div>
      <div className="flex gap-2 items-center">
        <Button onClick={startRecording}>Start Recording</Button>
        <Button onClick={stopRecording}>Stop Recording</Button>
      </div>
      <Card className="max-h-[340px] h-fit overflow-y-scroll border-none">
        <div id="json-tree">
          <JSONTree data={urlInteractions} theme={theme} invertTheme={false} />
        </div>
      </Card>
    </>
  );
}
