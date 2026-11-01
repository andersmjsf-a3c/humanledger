"use client";
import { useState } from "react";
import { downloadBytes } from "@/vault/folder";
import { GRADER_VERSION, packageGrader } from "./package";

// Builds the zip here, in the browser, with this site's address in it. Nothing is fetched or sent.
export function GraderDownload() {
  const [done, setDone] = useState(false);
  return (
    <div className="actions">
      <button
        className="primary"
        onClick={() => {
          downloadBytes(packageGrader(window.location.origin), "grade-my-work.zip");
          setDone(true);
        }}
      >
        Download the grading keep ({GRADER_VERSION})
      </button>
      {done && <span className="saved">Downloaded. In Claude, add the zip under Customize &gt; Skills.</span>}
    </div>
  );
}
