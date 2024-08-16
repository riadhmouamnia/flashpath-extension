import ToggleThemeButton from "@/components/toggle-theme";
import { MessageType } from "@/entrypoints/types";
// import { useClerk } from "@clerk/chrome-extension";
import { Button } from "./ui/button";

export default function Header() {
  // const clerk = useClerk();

  // const logout = async () => {
  //   clerk.signOut().then(() => {
  //     browser.runtime.sendMessage({
  //       messageType: MessageType.USER_LOGGED_OUT,
  //       user: null,
  //     });
  //   });
  // };
  return (
    <header className="w-full flex justify-end">
      {/* <Button variant="ghost" className="font-light" onClick={logout}>
        Logout
      </Button> */}
      <ToggleThemeButton />
    </header>
  );
}
