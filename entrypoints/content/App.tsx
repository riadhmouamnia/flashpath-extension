import { useState } from "react";
import "../../assets/main.css";
import { Button } from "@/components/ui/button";
import Youtube from "./strategies/youtube";
import Medium from "./strategies/medium";
import General from "./strategies/general";
import { MessageType } from "../types";

const YOUTUBE_URL = "https://www.youtube.com/watch";
const MEDIUM_URL = "https://medium.com";

export default () => {
  const [count, setCount] = useState(1);
  const increment = () => setCount((count) => count + 1);
  const [url, setUrl] = useState(window.location.href);

  useEffect(() => {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log("content:");
      console.log(message);
      if (message.messageType == MessageType.TAB_CHANGE) {
        const tabUrl = message.data.url;
        setUrl(tabUrl);
      } else if (message.messageType == MessageType.URL_CHANGE) {
        const url = message.data.url;
        setUrl(url);
      }
    });
  }, []);

  if (!url) {
    return <div>Loading...</div>;
  } else if (url.includes("www.youtube.com")) {
    return (
      <div>
        <p>{url}</p>
        <Youtube />
        <p>This is React. {count}</p>
        <Button onClick={increment}>Increment</Button>
      </div>
    );
  } else if (url.includes("medium.com")) {
    return (
      <div>
        <p>{url}</p>
        <Medium />
        <p>This is React. {count}</p>
        <Button onClick={increment}>Increment</Button>
      </div>
    );
  } else {
    return (
      <div>
        <p>{url}</p>
        <General />
        <p>This is React. {count}</p>
        <Button onClick={increment}>Increment</Button>
      </div>
    );
  }
};

//   return (
//     <div>
//       <p>{url}</p>
//       <p>This is React. {count}</p>
//       <Button onClick={increment}>Increment</Button>
//     </div>
//   );
// };
