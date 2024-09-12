import ToggleThemeButton from "@/components/toggle-theme";
import { MessageType, Network } from "@/entrypoints/types";
import { Button } from "./ui/button";
import { CgArrowsShrinkH } from "react-icons/cg";
import { hideUi } from "@/lib/utils";
import useNetworkState from "@/hooks/useNetworkState";
import { CiWifiOn, CiWifiOff } from "react-icons/ci";

export default function Header() {
  const network = useNetworkState() as Network;
  return (
    <header className="w-full flex justify-end items-center">
      <ToggleThemeButton />
      <Button
        onClick={() => {
          hideUi();
        }}
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
