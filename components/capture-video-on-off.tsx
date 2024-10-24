import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { loadFromBrowserStorage, saveToBrowserStorage } from "@/lib/utils";
import { BsFillRecord2Fill } from "react-icons/bs";
import { MessageType } from "@/entrypoints/types";

export default function CaptureVideoOnOrOff({
  isPathOn,
}: {
  isPathOn: boolean;
}) {
  const [isOn, setIsOn] = useState(false);

  useEffect(() => {
    const loadVideoStatus = async () => {
      const storageValue = await loadFromBrowserStorage("isVideoOn");
      if (storageValue) {
        setIsOn(storageValue);
      }
    };

    loadVideoStatus();
  }, []);

  const handleToggle = async () => {
    setIsOn(!isOn);
    if (isOn) {
      saveToBrowserStorage({ key: "isVideoOn", value: false });
      await browser.runtime.sendMessage({
        messageType: MessageType.CAPTURE_VIDEO_OFF,
        data: false,
      });
    } else {
      saveToBrowserStorage({ key: "isVideoOn", value: true });
      await browser.runtime.sendMessage({
        messageType: MessageType.CAPTURE_VIDEO_ON,
        data: true,
      });
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center justify-between w-full space-x-2">
        <Label htmlFor="video-mode">Capture Video</Label>
        <Switch
          checked={isOn}
          onCheckedChange={handleToggle}
          id="video-mode"
          disabled={!isPathOn}
          className="y-50 data-[state=checked]:bg-green-400 data-[state=unchecked]:bg-red-400"
        />
      </div>
    </div>
  );
}
