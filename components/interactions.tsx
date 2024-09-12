/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card } from "@/components/ui/card";
import useRRWEBRecorder from "@/hooks/useRRWEBRecorder";
// import useTrackInteractionWithReducer from "@/hooks/useTrackInteractionWithReducer2";
import usePageInteractions from "@/hooks/usePageInteractions";
import { JSONTree } from "react-json-tree";
import { Button } from "./ui/button";
import { BsFillRecord2Fill } from "react-icons/bs";
import { TbPointerPause } from "react-icons/tb";
import { LuMousePointerClick } from "react-icons/lu";

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
  pageKey,
}: {
  tabUrl: string;
  pageId: number;
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
      <div className="flex items-center justify-between my-4">
        {isRecording ? (
          <Button onClick={stopRecording} variant="ghost">
            <TbPointerPause className="text-xl" />
            "Pause Recording"
          </Button>
        ) : (
          <Button onClick={startRecording} variant="ghost">
            <LuMousePointerClick className="text-xl" />
            "Start Recording"
          </Button>
        )}

        {isRecording ? (
          <BsFillRecord2Fill className="text-red-500 animate-pulse text-xl" />
        ) : (
          <BsFillRecord2Fill className="text-secondary text-xl" />
        )}
      </div>
      <Card className="max-h-[340px] h-fit overflow-y-scroll border-none">
        <div id="json-tree">
          <JSONTree data={urlInteractions} theme={theme} invertTheme={false} />
        </div>
      </Card>
    </>
  );
}
