import type { JSX } from "react";
import type { RetrievedChunk } from "../types";
import { useTheme } from "../theme";

interface ChunksViewerProps {
  chunks: RetrievedChunk[];
}

export function ChunksViewer({ chunks }: ChunksViewerProps): JSX.Element {
  const theme = useTheme();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {chunks.map((chunk) => (
        <div
          key={chunk.chunk_index}
          style={{
            background: theme.deepBg,
            border: `1px solid ${theme.deepBorder}`,
            borderRadius: 6,
            padding: "10px 12px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 6,
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 9,
                color: theme.accent,
                letterSpacing: "0.08em",
                whiteSpace: "nowrap",
              }}
            >
              CHUNK {chunk.chunk_index}
            </span>
            <span
              style={{
                fontSize: 9,
                color: theme.textTertiary,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              📄 {chunk.filename}
            </span>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              color: theme.textSecondary,
              lineHeight: 1.7,
            }}
          >
            {chunk.text}
          </p>
        </div>
      ))}
    </div>
  );
}
