import { RxPencil2 } from "react-icons/rx";
import { Button } from "@/components/ui/button";

export default function AddNoteButton({
  handleShowForm,
}: {
  handleShowForm: () => void;
}) {
  return (
    <Button
      variant="ghost"
      title="Add note"
      size="icon"
      onClick={handleShowForm}
      className="mr-auto"
    >
      <RxPencil2 className="text-xl" />
    </Button>
  );
}
