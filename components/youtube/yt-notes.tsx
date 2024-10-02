import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Tag } from "emblor";
import ExtMessage, { MessageType, Note } from "@/entrypoints/types";
import {
  insertNotesToDb,
  loadFromBrowserStorage,
  saveToBrowserStorage,
} from "@/lib/utils";
import AddNoteButton from "../shared/add-note-button";
import ShowNotesButton from "../shared/show-notes-button";
import ShareButton from "../shared/share-button";
import NoteForm from "../shared/note-form";
import NoteListV2 from "../shared/note-list-v2";
import PlayPause from "./play-pause-button";

const userId = 123;
const pathId = 123456;

const YTNotes = memo(function ({
  tabUrl,
  videoId,
  pageId,
  username,
  pathname,
}: {
  tabUrl: string;
  videoId: string;
  pageId: number;
  username: string;
  pathname: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);
  const [showNotes, setShowNotes] = useState(true);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [highlightColor, setHighlightColor] = useState<string>("#56C880");
  const videoPlayer = useRef<HTMLVideoElement | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(
    () => !videoPlayer.current?.paused
  );

  console.log("state: ", notes);
  console.log("videoPlayer: ", videoPlayer.current);

  const onPlay = () => {
    setIsPlaying(true);
  };
  const onPause = () => {
    setIsPlaying(false);
  };

  const handlePlayPause = () => {
    videoPlayer.current?.paused
      ? videoPlayer.current?.play()
      : videoPlayer.current?.pause();
    setIsPlaying((prev) => !prev);
  };

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
    const currentTime = videoPlayer.current?.currentTime;
    if (currentTime) {
      setStartTime(currentTime);
    }
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
    const newEndTime =
      videoPlayer.current?.currentTime! < startTime
        ? startTime
        : videoPlayer.current?.currentTime! || 0;
    setNotes((prev) => {
      const updatedNotes = [
        {
          startTime,
          endTime: newEndTime,
          body,
          tags,
          highlightColor,
          createdAt: Date.now(),
          sort: prev.length + 1,
        },
        ...prev,
      ];
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
    setStartTime(newEndTime);
  };

  useEffect(() => {
    const player = document.querySelector<HTMLVideoElement>(
      "video.video-stream.html5-main-video"
    );
    if (player) {
      videoPlayer.current = player;
      setIsPlaying(!player.paused);
    }
  }, [videoId]);

  useEffect(() => {
    videoPlayer.current?.addEventListener("play", onPlay);
    videoPlayer.current?.addEventListener("pause", onPause);
    return () => {
      videoPlayer.current?.removeEventListener("play", onPlay);
      videoPlayer.current?.removeEventListener("pause", onPause);
    };
  }, []);

  useEffect(() => {
    const loadNotes = async () => {
      const storageValue = await loadFromBrowserStorage(
        tabUrl + username + pathname
      );
      console.log("storageValue: ", storageValue);
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
        <PlayPause isPlaying={isPlaying} handlePlayPause={handlePlayPause} />
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

export default YTNotes;
