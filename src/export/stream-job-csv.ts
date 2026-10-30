import { Job } from "../types/domain.js";
import { encodeJobCsvHeader, encodeJobCsvRow } from "./job-csv-row.js";

/**
 * Pull-based CSV body. The header is the first chunk. Later chunks are
 * catalog pages, stopped at `maxRows`.
 */
export function openJobCsvStream(input: {
  firstPage: readonly Job[];
  pageSize: number;
  maxRows: number;
  fetchPage: (page: number) => Promise<readonly Job[]>;
}): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let headerSent = false;
  let firstSent = false;
  let page = 1;
  let rowsSent = 0;

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        if (!headerSent) {
          controller.enqueue(encoder.encode(encodeJobCsvHeader()));
          headerSent = true;
          return;
        }
        if (rowsSent >= input.maxRows) {
          controller.close();
          return;
        }

        const jobs = firstSent ? await input.fetchPage(++page) : input.firstPage;
        firstSent = true;
        if (jobs.length === 0) {
          controller.close();
          return;
        }

        const pageRows = jobs.slice(0, input.pageSize);
        const room = input.maxRows - rowsSent;
        const slice = pageRows.slice(0, room);
        let chunk = "";
        for (const job of slice) chunk += encodeJobCsvRow(job);
        rowsSent += slice.length;
        controller.enqueue(encoder.encode(chunk));

        const reachedCap = slice.length < pageRows.length || rowsSent >= input.maxRows;
        const lastPage = pageRows.length < input.pageSize;
        if (reachedCap || lastPage) controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}
