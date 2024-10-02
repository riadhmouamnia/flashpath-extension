import { insertPathToDb, updatePathOnDb } from "@/lib/utils";
import { useAuthContext } from "./auth-privider";
import { MessageType } from "@/entrypoints/types";
import { useEffect, useRef, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Path } from "@/entrypoints/types";
import { Label } from "./ui/label";

export default function CreatePathForm() {
  const { user } = useAuthContext();
  const [savedPath, setSavedPath] = useState<string | null>(null); // Store the saved path
  const [isEditing, setIsEditing] = useState(false); // Track if in editing mode
  const [inputValue, setInputValue] = useState(""); // Track input field value
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !inputValue.trim()) {
      return;
    }

    const insertedPath = await insertPathToDb({
      path: inputValue,
      userId: user.id,
    });
    await browser.runtime.sendMessage({
      messageType: MessageType.CREATE_PATH, // Assuming the MessageType is a string
      data: insertedPath,
    });

    setSavedPath(inputValue); // Set saved path after submission
    setIsEditing(false); // Disable editing mode after save
  };

  const editPath = () => {
    setIsEditing(true); // Enable editing mode when Edit is clicked
  };

  useEffect(() => {
    const loadPath = async () => {
      if (!user) {
        return;
      }
      const data = await browser.storage.local.get(`${user.id}_path`);
      if (data[`${user.id}_path`]) {
        setSavedPath(data[`${user.id}_path`].name); // Load saved path
        setInputValue(data[`${user.id}_path`].name);
        inputRef.current!.value = data[`${user.id}_path`].name; // Set the input value
        setIsEditing(false); // Disable editing mode
      }
    };

    const handleKeyDown = (event: any) => {
      if (event.key !== "Enter") {
        event.stopPropagation();
      }
    };

    if (inputRef.current) {
      inputRef.current.addEventListener("keydown", handleKeyDown);
    }

    loadPath();
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  return (
    <form onSubmit={submit} className="mt-2">
      <Label htmlFor="path">Path: </Label>
      <div className="relative flex items-center justify-center w-full">
        <Input
          ref={inputRef}
          id="path"
          name="path"
          type="text"
          placeholder="Enter a path..."
          value={inputValue}
          onChange={handleInputChange}
          disabled={!isEditing && !!savedPath} // Disable input if not editing and there's a saved path
        />
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="flex text-xs tracking-wider items-center justify-center absolute disabled:bg-neutral-850 disabled:text-neutral-600 right-12 top-1 h-7"
          disabled={!inputValue.trim() || inputValue === savedPath} // Disable Save if input is empty or unchanged
        >
          Save
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={editPath}
          className="flex text-xs tracking-wider items-center justify-center absolute disabled:bg-neutral-850 disabled:text-neutral-600 right-1 top-1 h-7"
          disabled={!savedPath || isEditing} // Disable Edit if there's no saved path or already editing
        >
          Edit
        </Button>
      </div>
    </form>
  );
}
