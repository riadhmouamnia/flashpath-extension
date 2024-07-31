import { CiViewList } from "react-icons/ci";
import { Button } from "@/components/ui/button";

export default function ShowNotesButton({
  handleShowNotes,
}: {
  handleShowNotes: () => void;
}) {
  return (
    <Button
      variant="ghost"
      title="View notes"
      size="icon"
      onClick={handleShowNotes}
    >
      <CiViewList className="text-xl" />
    </Button>
  );
}
