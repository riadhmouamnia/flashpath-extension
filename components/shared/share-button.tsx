import { CiShare1 } from "react-icons/ci";
import { Button } from "@/components/ui/button";

export default function ShareButton() {
  return (
    <Button variant="ghost" title="Share" size="icon">
      <CiShare1 className="text-xl" />
    </Button>
  );
}
