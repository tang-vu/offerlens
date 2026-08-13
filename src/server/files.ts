import JSZip from "jszip";
import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_TEXT = 60_000;
const MAX_PDF_PAGES = 40;
const MAX_ZIP_ENTRIES = 1_500;
const MAX_UNCOMPRESSED = 20 * 1024 * 1024;

export async function parseResumeFile(file: File) {
  if (file.size <= 0 || file.size > MAX_BYTES)
    throw new Error("Résumé files must be between 1 byte and 5 MB.");
  const extension = file.name.toLowerCase().split(".").pop();
  const bytes = new Uint8Array(await file.arrayBuffer());

  if (extension === "pdf") {
    if (file.type && file.type !== "application/pdf")
      throw new Error("The PDF extension and declared MIME type do not match.");
    if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-")
      throw new Error("The file does not have a valid PDF signature.");
    const proxy = await getDocumentProxy(bytes);
    if (proxy.numPages > MAX_PDF_PAGES)
      throw new Error(`PDFs are limited to ${MAX_PDF_PAGES} pages.`);
    const result = await extractText(proxy, { mergePages: true });
    const text = result.text.trim();
    if (text.length < 20)
      throw new Error(
        "No useful text could be extracted from this PDF. Paste the résumé text instead.",
      );
    return { text: text.slice(0, MAX_TEXT), fileType: "pdf", truncated: text.length > MAX_TEXT };
  }

  if (extension === "docx") {
    const allowedMime = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/octet-stream",
      "",
    ];
    if (!allowedMime.includes(file.type))
      throw new Error("The DOCX extension and declared MIME type do not match.");
    if (bytes[0] !== 0x50 || bytes[1] !== 0x4b)
      throw new Error("The file does not have a valid DOCX/ZIP signature.");
    const zip = await JSZip.loadAsync(bytes, { checkCRC32: true, createFolders: false });
    const entries = Object.values(zip.files);
    if (entries.length > MAX_ZIP_ENTRIES)
      throw new Error("The DOCX contains too many archive entries.");
    if (!zip.file("[Content_Types].xml") || !zip.file("word/document.xml"))
      throw new Error("The archive is not a valid DOCX document.");
    if (
      entries.some(
        (entry) =>
          entry.unsafeOriginalName?.includes("..") ||
          entry.name.startsWith("/") ||
          entry.name.includes("\\"),
      )
    )
      throw new Error("Unsafe paths were found in the DOCX archive.");
    let total = 0;
    for (const entry of entries) {
      if (entry.dir) continue;
      const data = await entry.async("uint8array");
      total += data.byteLength;
      if (total > MAX_UNCOMPRESSED)
        throw new Error("The DOCX expands beyond the safe processing limit.");
    }
    const documentXml = await zip.file("word/document.xml")!.async("string");
    if (/<!DOCTYPE|<!ENTITY|SYSTEM\s+["']/i.test(documentXml))
      throw new Error("Unsafe XML declarations were found in the DOCX.");
    const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    const text = result.value.trim();
    if (text.length < 20)
      throw new Error(
        "No useful text could be extracted from this DOCX. Paste the résumé text instead.",
      );
    return {
      text: text.slice(0, MAX_TEXT),
      fileType: "docx",
      truncated: text.length > MAX_TEXT,
      warnings: result.messages.map((message) => message.message).slice(0, 5),
    };
  }

  throw new Error("Only PDF and DOCX résumé files are accepted.");
}
