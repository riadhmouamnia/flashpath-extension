import { Note } from "@/entrypoints/types";
import { CiCalendarDate, CiHashtag } from "react-icons/ci";

export default function NoteList({ notes }: { notes: Note[] }) {
  return (
    <ul className="flex w-full flex-1 text-sm font-light overflow-y-scroll no-scrollbar flex-col gap-2 text-left bg-primary/10 rounded-xl p-4 my-4">
      {notes.map((note, idx) => (
        <li
          className={`flex items-start justify-start gap-2 pt-1 pb-3 ${
            idx === notes.length - 1 ? "" : "border-b border-primary/10"
          }`}
          key={note.id}
        >
          <div className="">
            <p className="flex items-center justify-start gap-1 text-xs">
              <CiCalendarDate className="text-lg" />{" "}
              {new Date(note.createdAt).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                day: "2-digit",
                month: "short",
              })}
              :{" "}
              {note.body.length > 28
                ? note.body.slice(0, 28) + "..."
                : note.body}
            </p>
            {note.tags?.length ? (
              <p className="flex gap-1 text-xs items-center justify-start flex-wrap pl-2">
                <CiHashtag className="text-sm" />
                tags:{" "}
                {note.tags.map((tag) => (
                  <span
                    id={tag.id}
                    className="bg-primary/10 px-2 py-[2px] rounded"
                  >
                    {tag.text}
                  </span>
                ))}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
