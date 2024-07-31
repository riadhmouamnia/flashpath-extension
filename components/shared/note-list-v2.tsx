import { Note } from "@/entrypoints/types";
import { CiCalendarDate, CiHashtag, CiSearch } from "react-icons/ci";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

export default function NoteListV2({ notes }: { notes: Note[] }) {
  return (
    <div
      className={`flex flex-col gap-2 bg-primary/10 rounded-xl p-2 my-4 overflow-y-scroll no-scrollbar`}
    >
      {notes.map((note) => (
        <Card
          className={`text-sm border-none text-white rounded-lg bg-[${note.highlightColor}]`}
          style={{ backgroundColor: note.highlightColor }}
          key={note.id}
        >
          <CardHeader className="p-4 text-sm">
            <CardTitle className="text-white/80">
              {new Date(note.createdAt).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                day: "2-digit",
                month: "short",
              })}
            </CardTitle>
            {note.tags?.length ? (
              <CardDescription className="text-xs text-white/80 flex gap-1items-center justify-start flex-wrap pl-2">
                <CiHashtag className="text-sm" />
                tags:{" "}
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
          <CardContent className="text-xs font-light p-4 pt-0">
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
