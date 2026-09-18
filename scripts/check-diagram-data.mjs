/**
 * Prueft die Regel, an der das verwaiste Diagramm haengt.
 *
 * Ein Diagrammblock haelt seinen Quelltext selbst und zusaetzlich die EditorJS-Ids
 * der Bloecke, aus denen er gebaut wurde. Die Frage, die schiefgehen kann, ist
 * genau eine: bleibt der Text erhalten, wenn die Quellbloecke verschwinden?
 *
 * Aufruf: node --import tsx scripts/check-diagram-data.mjs
 */
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(import.meta.dirname, "..");
const frontend = path.join(ROOT, "apps/frontend");

const load = async (relative) => {
    try {
        return await import(pathToFileURL(path.join(frontend, relative)).href);
    } catch (error) {
        console.error(
            `\n${relative} liess sich nicht laden. Aufruf: node --import tsx scripts/check-diagram-data.mjs\n`,
        );
        throw error;
    }
};

const { buildDiagramData } = await load("src/tools/diagramData.ts");
const { checkSourceBlocks } = await load("src/tools/sourceBlocks.ts");

const failures = [];
const check = (name, condition, detail) => {
    if (condition) {
        console.log(`  ok        ${name}`);
    } else {
        console.log(`  FEHLER    ${name}${detail ? ` -> ${detail}` : ""}`);
        failures.push(name);
    }
};

console.log("\nbuildDiagramData");
console.log("-".repeat(90));

const plain = buildDiagramData({ text: "  Ein Absatz mit Inhalt.  ", sourceBlockIds: ["blk-1"], sourceBlockIndex: 3 });
check("Text wird getrimmt", plain.originalText === "Ein Absatz mit Inhalt.", plain.originalText);
check("Id wird uebernommen", plain.sourceBlockIds?.[0] === "blk-1");
check("Index wird uebernommen", plain.sourceBlockIndex === 3);

const noIds = buildDiagramData({ text: "Ohne Ids." });
check("Ohne Ids bleibt das Feld leer", Array.isArray(noIds.sourceBlockIds) && noIds.sourceBlockIds.length === 0);
check("Ohne Index steht -1", noIds.sourceBlockIndex === -1);

const junk = buildDiagramData({ text: "Mit Schrott.", sourceBlockIds: ["blk-1", "", "blk-2"] });
check("Leere Ids werden verworfen", junk.sourceBlockIds?.join(",") === "blk-1,blk-2", junk.sourceBlockIds?.join(","));

// Der eigentliche Punkt: der Text haengt nicht an den Ids.
const orphanData = buildDiagramData({ text: "Der Text bleibt.", sourceBlockIds: ["blk-1", "blk-2"] });
check(
    "Der Quelltext ist auch ohne die Quellbloecke vollstaendig",
    orphanData.originalText === "Der Text bleibt.",
);

console.log("\ncheckSourceBlocks");
console.log("-".repeat(90));

/** Minimaler Stub der EditorJS-Block-API, nur was die Pruefung anfasst. */
const apiWith = (ids) => ({
    blocks: {
        getById: (id) => (ids.includes(id) ? { id } : undefined),
    },
});

const noSource = checkSourceBlocks({ blocks: { getById: () => undefined } }, []);
check("Ohne Ids: keine Angabe", noSource.kind === "keine");

const intact = checkSourceBlocks(apiWith(["blk-1", "blk-2"]), ["blk-1", "blk-2"]);
check("Beide Bloecke da: vorhanden", intact.kind === "vorhanden", intact.kind);

const oneGone = checkSourceBlocks(apiWith(["blk-1"]), ["blk-1", "blk-2"]);
check("Ein Block geloescht: verwaist", oneGone.kind === "verwaist", oneGone.kind);
check(
    "Der fehlende Block wird benannt",
    oneGone.kind === "verwaist" && oneGone.missing.join(",") === "blk-2",
    oneGone.kind === "verwaist" ? oneGone.missing.join(",") : "-",
);

const allGone = checkSourceBlocks(apiWith([]), ["blk-1", "blk-2"]);
check("Alle geloescht: verwaist", allGone.kind === "verwaist", allGone.kind);

// Alte Notizen haben das Feld gar nicht. Sie duerfen keinen Fehler ausloesen,
// sondern gelten als "keine Angabe", weil es nichts zu pruefen gibt.
const oldNote = checkSourceBlocks(apiWith(["blk-1"]), undefined);
check("Altbestand ohne Feld: keine Angabe", oldNote.kind === "keine", oldNote.kind);

// Ein Verschieben darf nicht als Verlust gelesen werden: Ids bleiben, egal wo
// der Block steht. Die Pruefung fragt nicht nach der Position.
const moved = checkSourceBlocks(apiWith(["blk-1", "blk-2"]), ["blk-1", "blk-2"]);
check("Verschobene Bloecke gelten als vorhanden", moved.kind === "vorhanden", moved.kind);

console.log("\n" + "-".repeat(90));
if (failures.length > 0) {
    console.log(`${failures.length} Fehler.`);
    process.exit(1);
}
console.log("Alles in Ordnung.");
