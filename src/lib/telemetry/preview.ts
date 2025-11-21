const MAX_PREVIEW_LINES = 20;
const MAX_CHARACTERS = 32_000;

export type TelemetryPreview = {
  delimiter: "," | "\t" | " ";
  headers: string[];
  rows: string[][];
  rawSample: string;
  truncated: boolean;
};

function splitRows(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function detectDelimiter(line: string): "," | "\t" | " " {
  if (line.includes(",")) return ",";
  if (line.includes("\t")) return "\t";
  return " ";
}

export function parseTelemetryPreview(contents: string): TelemetryPreview {
  const slicedContents = contents.slice(0, MAX_CHARACTERS);
  const lines = splitRows(slicedContents);

  if (lines.length === 0) {
    return {
      delimiter: ",",
      headers: [],
      rows: [],
      rawSample: "",
      truncated: contents.length > MAX_CHARACTERS,
    };
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = lines[0].split(delimiter).map((value) => value.trim());
  const rows = lines
    .slice(1, MAX_PREVIEW_LINES + 1)
    .map((line) => line.split(delimiter).map((value) => value.trim()));

  return {
    delimiter,
    headers,
    rows,
    rawSample: lines.slice(0, MAX_PREVIEW_LINES + 1).join("\n"),
    truncated: contents.length > MAX_CHARACTERS || lines.length > MAX_PREVIEW_LINES + 1,
  };
}
