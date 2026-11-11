import { csv2json } from "json-2-csv";

export function parseCSV(
  rawInput: string,
  options: { delimiter: "comma" | "tab" | "auto"; googleSheetsMode: boolean },
): Record<number, string>[] {
  if (!rawInput.trim()) {
    return [];
  }

  if (options.googleSheetsMode) {
    return parseGoogleSheetsText(rawInput);
  }

  if (options.delimiter === "auto") {
    const tabCount = rawInput.match(/\t/g)?.length ?? 0;
    const commaCount = rawInput.match(/,/g)?.length ?? 0;
    options.delimiter = tabCount > commaCount ? "tab" : "comma";
  }

  return (
    csv2json(rawInput, {
      delimiter: { field: options.delimiter === "comma" ? "," : "\t" },
      headerFields: Array.from({ length: 99 }, (_, i) => String(i)),
    }) as Record<number, unknown>[]
  ).map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key, value ? String(value) : ""]),
    ),
  );
}

function parseGoogleSheetsText(rawInput: string): Record<number, string>[] {
  const results = [];

  while (rawInput) {
    const line = [];
    let eol = false;
    // 行を読み始める
    for (;;) {
      const chunk = rawInput.match(/^(.+?)(\t|$)/m);

      if (!chunk) {
        results.push(line);
        break;
      }

      if (chunk[1].startsWith('"')) {
        // ここからダブルクオート処理
        rawInput = rawInput.slice(chunk[0].length + (chunk[2] === "\t" ? 0 : 1));
        let cell = chunk[1].slice(1);

        if (cell.endsWith('"')) {
          line.push(cell.slice(0, -1));

          if (chunk[2] === "\t") {
            // まだ行は終わっていない
            continue;
          } else {
            // 行が終わった
            results.push(line);
            eol = true;
            break;
          }
        }

        for (;;) {
          const firstLine = rawInput.match(/^.*$/m)!;
          const cellEnd = firstLine[0].match(/"(\t|$)/m);

          if (cellEnd) {
            cell += "\n" + firstLine[0].slice(0, cellEnd.index!);
            rawInput = rawInput.slice(cellEnd.index! + 2);
            line.push(cell);

            if (cellEnd[1] === "\t") {
              // まだ行は終わっていない
              break;
            } else {
              // 行が終わった
              eol = true;
              results.push(line);
              break;
            }
          } else if (!rawInput) {
            // 全部終わった
            line.push(cell);
            results.push(line);
            eol = true;
            break;
          } else {
            cell += "\n" + firstLine[0];
            rawInput = rawInput.slice(firstLine[0].length + 1);
          }
        }
      } else {
        line.push(chunk[1]);
        rawInput = rawInput.slice(chunk[0].length);

        if (chunk[2] === "\t") {
          // まだ行は終わっていない
          continue;
        } else {
          // 行が終わった
          results.push(line);
          rawInput = rawInput.slice(1);
          eol = true;
          break;
        }
      }

      if (eol) {
        break;
      }
    }
  }

  return results.map((row) => Object.fromEntries(row.map((cell, i) => [i, cell])));
}
