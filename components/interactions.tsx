/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card } from "@/components/ui/card";
// import useRRWEBRecorder from "@/hooks/useRRWEBRecorder_sendEvent";
// import useRRWEBRecorder from "@/hooks/useRRWEBRecorder_WebSocket";
// import useRRWEBRecorder from "@/hooks/useRRWEBRecorder_SignalR";
// import useRRWEBRecorder from "@/hooks/useRRWEBRecorder_segments";
import useRRWEBRecorder from "@/hooks/useRRWEBRecorder";
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
}: {
  tabUrl: string;
  pageId: number;
}) {
  const { pageState } = usePageInteractions({ tabUrl, pageId });
  return (
    <Card className="max-h-[340px] h-fit overflow-y-scroll border-none">
      <div id="json-tree">
        <JSONTree data={pageState} theme={theme} invertTheme={false} />
      </div>
    </Card>
  );
}
