import { Tag, TagInput } from "emblor";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import HighlightColors from "./highlight-colors";

type NoteFormProps = {
  formRef: React.RefObject<HTMLFormElement>;
  handleSubmit: (e: React.FormEvent) => void;
  tags: Tag[];
  setTags: React.Dispatch<React.SetStateAction<Tag[]>>;
  activeTagIndex: number | null;
  setActiveTagIndex: React.Dispatch<React.SetStateAction<number | null>>;
  handleCancel: () => void;
  onHighlightColorChange: (color: string) => void;
  highlightColor: string;
};

export default function NoteForm({
  formRef,
  handleSubmit,
  tags,
  setTags,
  activeTagIndex,
  setActiveTagIndex,
  handleCancel,
  onHighlightColorChange,
  highlightColor,
}: NoteFormProps) {
  const [tagFocused, setTagFocused] = useState(false);

  useEffect(() => {
    const textarea =
      formRef.current?.querySelector<HTMLTextAreaElement>("#note-input");
    const tagInput =
      formRef.current?.querySelector<HTMLInputElement>("#tag-input");
    const handleKeyDown = (event: any) => {
      if (event.key !== "Enter") {
        event.stopPropagation();
      }
    };

    if (textarea && tagInput) {
      textarea.addEventListener("keydown", handleKeyDown);
      tagInput.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      if (textarea && tagInput) {
        textarea.removeEventListener("keydown", handleKeyDown);
        tagInput.removeEventListener("keydown", handleKeyDown);
      }
    };
  }, []);

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-col items-start justify-center gap-4 w-full"
    >
      <Textarea required id="note-input" placeholder="Take a note..." />
      <TagInput
        onFocus={() => setTagFocused(true)}
        onBlur={() => setTagFocused(false)}
        id="tag-input"
        styleClasses={{
          input: "outline-none bg-transparent shadow-none p-1",
          tag: {
            body: "bg-secondary/50 hover:bg-secondary pl-4 rounded",
          },
          inlineTagsContainer: `p-2 ${tagFocused ? "ring-1 ring-primary" : ""}`,
        }}
        placeholder="Enter a topic or tag..."
        tags={tags}
        setTags={(newTags) => {
          setTags(newTags);
        }}
        activeTagIndex={activeTagIndex}
        setActiveTagIndex={setActiveTagIndex}
      />
      <div className="w-full flex items-center justify-between">
        <p>Highlight: </p>
        <HighlightColors
          onColorChange={onHighlightColorChange}
          selectedColor={highlightColor}
        />
      </div>
      <div className="flex gap-2 self-end">
        <Button variant="default" type="submit">
          Save
        </Button>
        <Button variant="secondary" type="button" onClick={handleCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
