import ToggleThemeButton from "@/components/toggle-theme";

export default function Header() {
  return (
    <header className="w-full flex justify-end">
      <ToggleThemeButton />
    </header>
  );
}
