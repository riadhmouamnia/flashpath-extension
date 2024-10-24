import ToggleThemeButton from "@/components/toggle-theme";
import { MessageType, Network } from "@/entrypoints/types";
import { Button } from "./ui/button";
import { CgArrowsShrinkH } from "react-icons/cg";
import {
  hideUi,
  loadFromBrowserStorage,
  saveToBrowserStorage,
  showUi,
} from "@/lib/utils";
import useNetworkState from "@/hooks/useNetworkState";
import { CiWifiOn, CiWifiOff } from "react-icons/ci";
import { useEffect, useState } from "react";

export default function Header() {
  const network = useNetworkState() as Network;

  const handleHideUi = () => {
    browser.runtime.sendMessage({
      messageType: MessageType.HIDE_UI,
    });
    saveToBrowserStorage({
      key: "hideUi",
      value: true,
    });
  };
  return (
    <header className="w-full flex justify-end items-center">
      <ToggleThemeButton />
      <Button
        onClick={handleHideUi}
        size="icon"
        variant="ghost"
        className="font-light"
      >
        <CgArrowsShrinkH className="text-lg" />
      </Button>
      <div className="flex gap-2 items-center">
        {network.online ? (
          <Button size="icon" variant="ghost" className="font-light">
            <CiWifiOn className="text-green-500 text-lg" />
          </Button>
        ) : (
          <Button size="icon" variant="ghost" className="font-light">
            <CiWifiOff className="text-red-500 text-lg" />
          </Button>
        )}
      </div>
    </header>
  );
}
