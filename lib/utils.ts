import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const saveToLocalStorage = ({
  key,
  value,
}: {
  key: string;
  value: any;
}) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const loadFromLocalStorage = (key: string) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : {};
};

export const clearLocalStorage = (key: string) => {
  localStorage.removeItem(key);
};

export const setThemeToBody = (theme: string) => {
  const element = document.querySelector("wxt-react-example");
  if (element) {
    const shadowRoot = element.shadowRoot;
    if (shadowRoot) {
      const body = shadowRoot.querySelector("body");
      if (body) {
        body.className = theme;
      }
    }
  }
};

export const toggle = () => {
  const element = document.querySelector("wxt-react-example");
  if (element) {
    const shadowRoot = element.shadowRoot;
    if (shadowRoot) {
      const body = shadowRoot.querySelector("body");
      if (!body) {
        return;
      }

      // change right: 0px style to right: -600px
      const style = getComputedStyle(body);
      const right = style.getPropertyValue("right");
      const newValue = right === "0px" ? "-600px" : "0px";
      body.style.right = newValue;

      //  or "toggle", body.style.display
      //   if (body.style.display === "none") {
      //     body.style.display = "block";
      //   } else {
      //     body.style.display = "none";
      //   }
    }
  }
};
