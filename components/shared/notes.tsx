import { memo, useEffect, useRef, useState } from "react";
import NoteForm from "./note-form";
import { Tag } from "emblor";
import ShowNotesButton from "./show-notes-button";
import AddNoteButton from "./add-note-button";
import ShareButton from "./share-button";
import { Note } from "@/entrypoints/types";
import { loadFromBrowserStorage, saveToBrowserStorage } from "@/lib/utils";
// import NoteList from "./note-list";
import NoteListV2 from "./note-list-v2";

const Notes = memo(function ({ tabUrl }: { tabUrl: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);
  const [showNotes, setShowNotes] = useState(true);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [highlightColor, setHighlightColor] = useState<string>("#56C880");
  console.log("state: ", notes);

  const handleHighlightColorChange = (color: string) => {
    setHighlightColor(color);
  };

  const handleCancel = () => {
    setShowNoteForm(false);
    setTags([]);
    setActiveTagIndex(null);
  };

  const handleShowNotes = () => {
    setShowNotes((prev) => !prev);
  };

  const handleShowForm = () => {
    setShowNoteForm((prev) => !prev);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form) {
      return;
    }
    const note = form.querySelector<HTMLTextAreaElement>("#note-input")?.value;
    if (!note) {
      return;
    }
    setNotes((prev) => {
      const updatedNotes = [
        {
          id: Date.now(),
          note,
          tags,
          highlightColor,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ];
      void saveToBrowserStorage({ key: tabUrl, value: updatedNotes });
      return updatedNotes;
    });
    form.reset();
    setTags([]);
    setActiveTagIndex(null);
    setShowNoteForm(false);
  };

  useEffect(() => {
    const loadNotes = async () => {
      const storageValue = await loadFromBrowserStorage(tabUrl);
      console.log("storageValue: ", storageValue);
      if (storageValue) {
        setNotes(storageValue);
      } else {
        setNotes([]);
      }
    };
    loadNotes();
  }, [tabUrl]);

  return (
    <div className="my-4 flex flex-col gap-2">
      <div className="flex items-center">
        <AddNoteButton handleShowForm={handleShowForm} />
        <ShowNotesButton handleShowNotes={handleShowNotes} />
        <ShareButton />
      </div>
      {showNoteForm && (
        <NoteForm
          formRef={formRef}
          activeTagIndex={activeTagIndex}
          setActiveTagIndex={setActiveTagIndex}
          tags={tags}
          setTags={setTags}
          handleCancel={handleCancel}
          handleSubmit={handleSubmit}
          highlightColor={highlightColor}
          onHighlightColorChange={handleHighlightColorChange}
        />
      )}
      {showNotes &&
        (notes.length > 0 ? <NoteListV2 notes={notes} /> : <p>No notes yet</p>)}
    </div>
  );
});

export default Notes;
