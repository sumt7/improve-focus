import { deflateRawSync } from "node:zlib";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

const root = new URL("../", import.meta.url);
const siteDir = new URL("../site/", import.meta.url);
const outputDir = new URL("../dist/", import.meta.url);
const extensionFileTypes = new Set([
  ".css",
  ".gif",
  ".html",
  ".ico",
  ".jpeg",
  ".jpg",
  ".js",
  ".png",
  ".svg",
  ".webp"
]);

function makeCrcTable() {
  return Array.from({ length: 256 }, (_, index) => {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
    }
    return value >>> 0;
  });
}

const crcTable = makeCrcTable();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function zipFiles(files) {
  const localParts = [];
  const directoryParts = [];
  let offset = 0;

  for (const file of files) {
    const name = Buffer.from(file.name.replaceAll("\\", "/"));
    const compressed = deflateRawSync(file.content, { level: 9 });
    const checksum = crc32(file.content);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(8, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(file.content.length, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localHeader.writeUInt16LE(0, 28);

    const directoryHeader = Buffer.alloc(46);
    directoryHeader.writeUInt32LE(0x02014b50, 0);
    directoryHeader.writeUInt16LE(20, 4);
    directoryHeader.writeUInt16LE(20, 6);
    directoryHeader.writeUInt16LE(0, 8);
    directoryHeader.writeUInt16LE(8, 10);
    directoryHeader.writeUInt16LE(0, 12);
    directoryHeader.writeUInt16LE(0, 14);
    directoryHeader.writeUInt32LE(checksum, 16);
    directoryHeader.writeUInt32LE(compressed.length, 20);
    directoryHeader.writeUInt32LE(file.content.length, 24);
    directoryHeader.writeUInt16LE(name.length, 28);
    directoryHeader.writeUInt16LE(0, 30);
    directoryHeader.writeUInt16LE(0, 32);
    directoryHeader.writeUInt16LE(0, 34);
    directoryHeader.writeUInt16LE(0, 36);
    directoryHeader.writeUInt32LE(0, 38);
    directoryHeader.writeUInt32LE(offset, 42);

    localParts.push(localHeader, name, compressed);
    directoryParts.push(directoryHeader, name);
    offset += localHeader.length + name.length + compressed.length;
  }

  const directory = Buffer.concat(directoryParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, directory, end]);
}

async function copySiteFiles() {
  const entries = await readdir(siteDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const content = await readFile(new URL(entry.name, siteDir));
    await writeFile(new URL(entry.name, outputDir), content);
  }
}

async function collectExtensionFiles() {
  const entries = await readdir(root, { withFileTypes: true });
  const names = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name === "manifest.json" || extensionFileTypes.has(extname(name).toLowerCase()))
    .sort();

  if (!names.includes("manifest.json")) {
    throw new Error("manifest.json is missing, so the extension ZIP cannot be built.");
  }

  return Promise.all(names.map(async (name) => ({
    name,
    content: await readFile(new URL(name, root))
  })));
}

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
await copySiteFiles();

const icon = await readFile(new URL("../icon.png", import.meta.url));
await writeFile(new URL("icon.png", outputDir), icon);

const extensionFiles = await collectExtensionFiles();
const archive = zipFiles(extensionFiles);
await writeFile(new URL("improve-focus.zip", outputDir), archive);

console.log(`Built landing page and improve-focus.zip with ${extensionFiles.length} extension files.`);
