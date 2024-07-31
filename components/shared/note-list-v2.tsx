import { Note } from "@/entrypoints/types";
import { CiHashtag, CiSearch, CiTimer } from "react-icons/ci";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { useEffect, useState } from "react";
import { formatVideoTime } from "@/lib/utils";

export default function NoteListV2({ notes }: { notes: Note[] }) {
  const [search, setSearch] = useState<string>("");
  const [filteredNotes, setFilteredNotes] = useState<Note[]>(notes);

  useEffect(() => {
    setFilteredNotes(
      notes.filter(
        (note) =>
          note.note.toLowerCase().includes(search.toLowerCase()) ||
          note.tags?.some((tag) =>
            tag.text.toLowerCase().includes(search.toLowerCase())
          )
      )
    );
  }, [search, notes]);

  return (
    <div
      className={`flex flex-col h-[400px] pb-8 gap-2 bg-primary/10 rounded-xl p-2 my-4 overflow-y-scroll no-scrollbar`}
    >
      {/* <div className="flex gap-1 items-center justify-start w-full bg-primary/10 rounded-lg p-2"> */}
      <div className="flex gap-1 items-center justify-start w-full border border-primary/10 rounded-lg px-2 py-1">
        <CiSearch className="text-xl" />
        <Input
          className="h-7 b border-none focus-visible:ring-0 shadow-none p-0 text-sm font-light"
          type="text"
          placeholder="Search notes"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {/* </div> */}
      {filteredNotes.map((note) => (
        <Card
          className={`text-sm border-none text-white rounded-lg bg-[${note.highlightColor}]`}
          style={{ backgroundColor: note.highlightColor }}
          key={note.id}
        >
          <CardHeader className="p-4 text-sm pb-2">
            <CardTitle className="text-white/80 flex items-center justify-between gap-2">
              {new Date(note.createdAt).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                day: "2-digit",
                month: "short",
              })}
              {note.startTime && note.endTime ? (
                <span className="text-xs pl-2 flex items-center justify-start gap-1 font-light">
                  <CiTimer />
                  {formatVideoTime(note.startTime)} -{" "}
                  {formatVideoTime(note.endTime)}
                </span>
              ) : null}
            </CardTitle>
            {note.tags?.length ? (
              <CardDescription className="text-xs text-white/80 flex gap-1 1items-center justify-start flex-wrap font-light">
                tags:
                {note.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="bg-primary/10 px-2 py-[2px] rounded"
                  >
                    {tag.text}
                  </span>
                ))}
              </CardDescription>
            ) : null}
          </CardHeader>
          <CardContent className="text-sm font-light p-4 pt-0">
            <p>
              {note.note.length > 28
                ? note.note.slice(0, 100) + "..."
                : note.note}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
