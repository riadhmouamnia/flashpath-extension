import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { loadFromBrowserStorage, saveToBrowserStorage } from "@/lib/utils";
import ExtMessage, { MessageType } from "@/entrypoints/types";
import { Runtime } from "wxt/browser";

export default function TurnPathOnOrOff() {
  const [isOn, setIsOn] = useState(false);

  useEffect(() => {
    const loadPathStatus = async () => {
      const storageValue = await loadFromBrowserStorage("isPathOn");
      if (storageValue) {
        setIsOn(storageValue);
      }
    };
    const handleMessage = (
      message: ExtMessage,
      sender: Runtime.MessageSender,
      sendResponse: () => void
    ) => {
      if (message.messageType == MessageType.PATH_ON) {
        setIsOn(true);
      } else if (message.messageType === MessageType.PATH_OFF) {
        setIsOn(false);
      }
    };

    loadPathStatus();
    browser.runtime.onMessage.addListener(handleMessage);
    return () => {
      browser.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  const handleToggle = async () => {
    setIsOn(!isOn);
    if (isOn) {
      saveToBrowserStorage({ key: "isPathOn", value: false });
      await browser.runtime.sendMessage({
        messageType: MessageType.PATH_OFF,
        data: false,
      });
    } else {
      saveToBrowserStorage({ key: "isPathOn", value: true });
      await browser.runtime.sendMessage({
        messageType: MessageType.PATH_ON,
        data: true,
      });
    }
  };

  return (
    <div className="flex items-center justify-between space-x-2">
      <Label htmlFor="path-mode">Capture Path</Label>
      <Switch
        checked={isOn}
        onCheckedChange={handleToggle}
        id="path-mode"
        className="y-50 data-[state=checked]:bg-green-400 data-[state=unchecked]:bg-red-400"
      />
    </div>
  );
}
