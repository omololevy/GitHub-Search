"use client";

import { useState } from "react";

export default function UserSearch({
  onSearch,
}: {
  onSearch: (username: string) => void;
}) {
  const [username, setUsername] = useState("");

  return (
    <div className="w-full max-w-md">
      <div className="flex gap-2">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter GitHub username"
          className="flex-1 p-2 border rounded-lg"
        />
        <button
          onClick={() => onSearch(username)}
          className="px-4 py-2 bg-foreground text-background rounded-lg hover:bg-[#383838]"
        >
          Search
        </button>
      </div>
    </div>
  );
}
