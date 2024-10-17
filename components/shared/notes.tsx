import { memo, useEffect, useRef, useState } from "react";
import NoteForm from "./note-form";
import { Tag } from "emblor";
import ShowNotesButton from "./show-notes-button";
import AddNoteButton from "./add-note-button";
import ShareButton from "./share-button";
import ExtMessage, { MessageType, Note } from "@/entrypoints/types";
import {
  insertNotesToDb,
  loadFromBrowserStorage,
  saveToBrowserStorage,
} from "@/lib/utils";
// import NoteList from "./note-list";
import NoteListV2 from "./note-list-v2";
import * as signalR from "@microsoft/signalr";

const Notes = memo(function ({
  tabUrl,
  pageId,
  pathname,
  username,
}: {
  tabUrl: string;
  pageId?: number;
  pathname: string;
  username: string;
}) {
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
    const body = form.querySelector<HTMLTextAreaElement>("#note-input")?.value;
    if (!body) {
      return;
    }
    setNotes((prev) => {
      const updatedNotes = [
        {
          body,
          tags,
          highlightColor,
          createdAt: Date.now(),
          sort: prev.length + 1,
        },
        ...prev,
      ];
      // void sendNoteToQuix({
      //   username,
      //   note: {
      //     note,
      //     tags,
      //     highlightColor,
      //     createdAt: Date.now(),
      //     sort: prev.length + 1,
      //   },
      //   pathname,
      //   pageUrl: tabUrl,
      // });
      insertNotesToDb({
        note: {
          body,
          tags,
          highlightColor,
          sort: prev.length + 1,
        },
        pageId,
      } as any);
      void saveToBrowserStorage({
        key: tabUrl + username + pathname,
        value: updatedNotes,
      });
      return updatedNotes;
    });
    form.reset();
    setTags([]);
    setActiveTagIndex(null);
    setShowNoteForm(false);
  };

  useEffect(() => {
    const loadNotes = async () => {
      const storageValue = await loadFromBrowserStorage(
        tabUrl + username + pathname
      );
      if (storageValue) {
        setNotes(storageValue);
      } else {
        setNotes([]);
      }
    };
    loadNotes();
  }, [tabUrl]);

  useEffect(() => {
    browser.runtime.onMessage.addListener(
      (message: ExtMessage, sender, sendResponse) => {
        console.log("notes:");
        console.log(message);
        if (message.messageType === MessageType.SELECT_TEXT) {
          if (!username || !pathname || !tabUrl) return;
          setNotes((prev) => {
            const updatedNotes = [
              {
                body: message.data.selectionText,
                tags: [{ id: "1", text: "selection" }],
                highlightColor,
                createdAt: Date.now(),
                sort: prev.length + 1,
              },
              ...prev,
            ];
            void insertNotesToDb({
              note: {
                body: message.data.selectionText,
                tags: [{ id: "1", text: "selection" }],
                highlightColor,
                sort: prev.length + 1,
              },
              pageId,
            } as any);
            void saveToBrowserStorage({
              key: tabUrl + username + pathname,
              value: updatedNotes,
            });
            return updatedNotes;
          });
        }
      }
    );
  }, []);

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

async function sendNoteToQuix({
  username,
  note,
  pathname,
  pageUrl,
}: {
  username: string;
  note: Note;
  pathname: string;
  pageUrl: string;
}) {
  // Replace these with your actual values
  const token = "pat-9700c4e8e8df409c95c6a9e892bee992"; // Replace with your Quix token
  const environmentId = "sherif-flashpath-dev"; // Replace with your environment ID
  const topic = "raw-websocket"; // Replace with your topic name
  const streamId = username || "sherif"; // Replace with your stream ID

  const options = {
    accessTokenFactory: () => token,
    skipNegotiation: true,
    transport: signalR.HttpTransportType.WebSockets,
  };

  const connection = new signalR.HubConnectionBuilder()
    .withUrl(`https://writer-${environmentId}.platform.quix.io/hub`, options)
    .configureLogging(signalR.LogLevel.Information)
    .build();

  // Establish connection
  try {
    await connection.start();
    console.log("Connection started");
    // Sample parameter data
    const parameterData = {
      epoch: Date.now() * 1000000, // set now as time starting point, in nanoseconds
      timestamps: [Date.now() * 1000000],
      numericValues: {},
      stringValues: {
        username: [username],
        pathname: [pathname],
        note: [JSON.stringify(note)],
      },
      tagValues: {
        path: [window.location.pathname],
      },
      binaryValues: {},
    };
    // Send event data
    console.log("Sending data...");
    // send data to Quix
    await connection.send("SendParameterData", topic, streamId, parameterData);
    console.log("Data sent");
  } catch (error) {
    console.error("SignalR connection error:", error);
  }

  await connection.stop();
}
