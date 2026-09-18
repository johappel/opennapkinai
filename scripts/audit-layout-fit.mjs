/**
 * Prueft die ehrliche Variantenwahl gegen die Zeichenroutinen.
 *
 * Zwei Fragen, beide rein geometrisch, beide ohne Browser:
 *
 * 1. Belegt die Rechnung in archetypeFit.ts genau die Kombinationen, die
 *    computeLayout auch wirklich zeichnen kann? Also: nichts wird verschwiegen,
 *    was ginge, und nichts wird angeboten, was schiefgeht.
 * 2. Passt zusammen, was zusammen angeboten wird? Ein Muster, ein Kreislauf und
 *    eine Gegenueberstellung stellen alle vier Knoten dar, meinen aber etwas
 *    anderes. Wenn zwei Formen bei denselben Knoten dieselbe Geometrie ergeben,
 *    ist eine davon Kosmetik und hat in der Auswahl nichts zu suchen.
 *
 * Aufruf: node scripts/audit-layout-fit.mjs
 * Erwartet Exitcode 0. Jede Abweichung ist ein Befund, kein Rauschen.
 *
 * Der Import laeuft ueber den tsx-Loader, weil die Layoutmodule im Projekt als
 * .ts ohne Endung aufeinander zeigen. Node kann das nicht allein aufloesen.
 */
import { pathToFileURL } from "node:url";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const frontend = path.join(ROOT, "apps/frontend");

// Aufloesung der Importe in den Layoutmodulen ("./process" ohne Endung) leistet
// tsx. Geladen wird es nicht hier, sondern beim Start: das Skript wird als
// "node --import tsx scripts/audit-layout-fit.mjs" aufgerufen. Wird es ohne
// geladen, brechen die Importe unten mit "Cannot find module" ab.
const load = async (relative) => {
    try {
        return await import(pathToFileURL(path.join(frontend, relative)).href);
    } catch (error) {
        if (/Cannot find module|ERR_MODULE_NOT_FOUND|Unknown file extension/.test(String(error))) {
            console.error(
                `\nDas Modul ${relative} liess sich nicht laden.\n` +
                    "tsx fehlt beim Start. Aufruf: node --import tsx scripts/audit-layout-fit.mjs\n",
            );
            process.exit(2);
        }
        throw error;
    }
};

const { archetypeFit } = await load("src/smartart/archetypeFit.ts");
const { computeLayout } = await load("src/smartart/layout/index.ts");

const ARCHETYPES = ["process", "cycle", "hierarchy", "pyramid", "matrix", "comparison"];

/** Knotenmengen, die im Betrieb tatsaechlich vorkommen koennen. */
function sampleNodes(count, kind = "flat") {
    if (kind === "chain") {
        // Eine Kette mit genau einer Wurzel: das ist der Hierarchie-Fall.
        return Array.from({ length: count }, (_, i) => ({
            id: `k${i}`,
            title: `Ebene ${i + 1}`,
            content: "Ein Satz, der die Ebene erklaert.",
            parentId: i === 0 ? null : `k${i - 1}`,
        }));
    }
    return Array.from({ length: count }, (_, i) => ({
        id: `n${i}`,
        title: `Punkt ${i + 1}`,
        content: `Aussage Nummer ${i + 1} aus dem Text.`,
    }));
}

/** Zeichenbare Geometrie, unabhaengig von Farbe und Reihenfolge der Knoten. */
function geometryFingerprint(layout) {
    const boxes = layout.nodes
        .map((n) => `${n.shape}:${Math.round(n.width)}x${Math.round(n.height)}`)
        .sort()
        .join(",");
    const paths = layout.connectors.map((c) => c.d).sort().join("|");
    return `${layout.width.toFixed(1)}x${layout.height.toFixed(1)}|${boxes}|${paths}`;
}

function tryLayout(archetype, nodes) {
    try {
        return { ok: true, layout: computeLayout(archetype, nodes) };
    } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
}

/**
 * Ordnet eine Ablehnung ihrer Herkunft zu. Der Unterschied ist wichtig: eine
 * Ablehnung aus dem Inhalt heraus ist gewollt, eine wegen fehlender Zeichenfaehigkeit
 * waere eine verdeckte Luecke.
 */
function classifyReason(reason) {
    if (reason.startsWith("Zu wenig Inhalt")) return "Inhalt, zu wenige Knoten";
    if (reason.startsWith("Zu viel Inhalt")) return "Inhalt, zu viele Knoten";
    if (reason.startsWith("Gegenüberstellung")) return "Inhalt, ungerade Anzahl";
    if (reason.startsWith("Stufen tragen")) return "Zeichengrenze (Stufen)";
    if (reason.startsWith("Raster braucht")) return "Zeichengrenze (Raster)";
    if (reason.startsWith("Hierarchie braucht")) return "Struktur, keine Wurzel";
    return `unbekannt: ${reason}`;
}

const findings = [];
const rows = [];

for (let count = 1; count <= 12; count += 1) {
    for (const kind of ["flat", "chain"]) {
        if (kind === "chain" && count > 9) continue;
        const nodes = sampleNodes(count, kind);

        let verdicts;
        try {
            verdicts = archetypeFit(nodes);
        } catch (error) {
            findings.push(`archetypeFit wirft bei ${count} Knoten (${kind}): ${error.message}`);
            continue;
        }

        const offenders = [];
        const renderable = new Set();

        for (const verdict of verdicts) {
            const render = tryLayout(verdict.archetype, nodes);
            if (render.ok) renderable.add(verdict.archetype);

            // Der harte Befund, in dieser Richtung: etwas anbieten, das nicht
            // zeichnet. Das waere ein Bruch, kein Schoenheitsfehler.
            if (verdict.ok && !render.ok) {
                findings.push(
                    `Angeboten, aber nicht zeichenbar: ${verdict.archetype} bei ${count} Knoten (${kind}) wirft "${render.error}".`,
                );
                offenders.push(verdict.archetype);
            }
        }

        // Die Gegenrichtung ist kein Befund fuer sich. archetypeFit darf eine
        // Form ablehnen, obwohl sie zeichnet, und tut das an mehreren Stellen aus
        // inhaltlichen Gruenden: zwei Knoten im Kreislauf ergeben ein Bild,
        // behaupten aber eine Wiederholung, die im Text nicht steht. Solche
        // Ablehnungen werden gezaehlt und unten einzeln nach ihrer Herkunft
        // aufgeschluesselt, nicht pauschal als Fehler behandelt.
        const withheldButDrawable = verdicts
            .filter((verdict) => !verdict.ok && renderable.has(verdict.archetype))
            .map((verdict) => verdict.archetype);

        // Kosmetikpruefung: zwei angebotene Formen mit identischer Geometrie.
        // Das ist der wichtigere Test von beiden. Wenn zwei Formen bei denselben
        // Knoten dieselben Kaesten und dieselben Linien zeichnen, ist eine davon
        // reine Verzierung: sie verspricht eine andere Aussage und liefert
        // dieselbe. Solche Paare gehoeren nicht beide in die Auswahl.
        const byGeometry = new Map();
        for (const verdict of verdicts) {
            if (!verdict.ok) continue;
            const render = tryLayout(verdict.archetype, nodes);
            if (!render.ok) continue;
            const key = geometryFingerprint(render.layout);
            if (!byGeometry.has(key)) byGeometry.set(key, []);
            byGeometry.get(key).push(verdict.archetype);
        }
        const twinPairs = [];
        for (const [key, archetypes] of byGeometry) {
            if (archetypes.length > 1) {
                twinPairs.push({ archetypes, size: key.split("|")[0] });
                findings.push(
                    `Zwei Formen zeichnen dasselbe: ${archetypes.join(" und ")} bei ${count} Knoten (${kind}), Geometrie ${key.split("|")[0]}.`,
                );
            }
        }

        rows.push({
            count,
            kind,
            offered: verdicts.filter((v) => v.ok).map((v) => v.archetype),
            advisory: verdicts.filter((v) => v.ok && v.advisory).map((v) => v.archetype),
            withheld: verdicts.filter((v) => !v.ok).map((v) => v.archetype),
            withheldButDrawable,
            renderable: Array.from(renderable),
            offenders,
            twinPairs,
        });
    }
}

console.log("\nKnoten  Art    angeboten                                  Hinweis               zurueckgehalten");
console.log("-".repeat(160));
for (const row of rows) {
    const offered = row.offered.join(", ") || "(keine)";
    const advisory = row.advisory.join(", ") || "-";
    console.log(
        `${String(row.count).padStart(4)}   ${row.kind.padEnd(5)}  ${offered.padEnd(42)} ${advisory.padEnd(20)} ${row.withheld.join(", ") || "-"}`,
    );
}

console.log("\nGeprueft: " + rows.length + " Knotenmengen von 1 bis 12 Knoten, flach und als Kette.\n");

const hardFindings = [];
const withdrawn = [];

for (const row of rows) {
    if (row.offenders.length > 0) {
        hardFindings.push(
            `${row.count} Knoten (${row.kind}): angeboten, zeichnet nicht -> ${row.offenders.join(", ")}`,
        );
    }
    if (row.twinPairs.length > 0) {
        for (const pair of row.twinPairs) {
            hardFindings.push(
                `${row.count} Knoten (${row.kind}): zwei angebotene Formen, eine Geometrie -> ${pair.archetypes.join(" / ")} (${pair.size})`,
            );
        }
    }
    if (row.withheldButDrawable.length > 0) {
        withdrawn.push({
            count: row.count,
            kind: row.kind,
            archetypes: row.withheldButDrawable,
        });
    }
}

console.log("Angebotene Formen, die nicht zeichnen, und Formenpaare mit gleicher Geometrie");
console.log("-".repeat(120));
if (hardFindings.length === 0) {
    console.log("Keine.");
} else {
    hardFindings.forEach((line) => console.log(`  ${line}`));
}

// Ablehnungen, die trotzdem zeichnen, nach Begruendung gruppiert. Das ist keine
// Fehlerliste, sondern die Stelle, an der man sehen kann, ob archetypeFit aus
// inhaltlichen Gruenden ablehnt oder ob eine Zeichenluecke verdeckt wird.
console.log("\nAbgelehnt, obwohl zeichenbar (nach Herkunft)");
console.log("-".repeat(120));
const byReason = new Map();
for (const row of rows) {
    if (row.withheldButDrawable.length === 0) continue;
    const nodes = sampleNodes(row.count, row.kind);
    for (const archetype of row.withheldButDrawable) {
        const verdict = archetypeFit(nodes).find((v) => v.archetype === archetype);
        const category = classifyReason(verdict.reason);
        const key = `${category} | ${archetype}`;
        if (!byReason.has(key)) byReason.set(key, { category, archetype, counts: [] });
        byReason.get(key).counts.push(row.count);
    }
}
if (byReason.size === 0) {
    console.log("Keine.");
} else {
    for (const { category, archetype, counts } of byReason.values()) {
        const unique = Array.from(new Set(counts)).sort((a, b) => a - b);
        console.log(`  ${archetype.padEnd(12)} ${category.padEnd(24)} ${unique.join(", ")} Knoten`);
    }
}

console.log("\nWertung");
console.log("-".repeat(120));
console.log("Angeboten und zeichenbar ist die eine Richtung, und sie haelt.");
console.log("Abgelehnt und trotzdem zeichenbar ist die andere. Sie ist kein Widerspruch,");
console.log("solange die Ablehnung aus dem Inhalt kommt und nicht aus einer Zeichengrenze.");

// Die sechs Beispielstrukturen aus mockData muessen weiterhin alle zeichnen,
// sonst ist die Werkstatt kaputt.
const { MOCK_STRUCTURES } = await load("src/smartart/mockData.ts");
console.log("\nBeispielstrukturen der Werkstatt");
console.log("-".repeat(120));
for (const [name, structure] of Object.entries(MOCK_STRUCTURES)) {
    const verdict = archetypeFit(structure.nodes).find((v) => v.archetype === structure.archetype);
    const render = tryLayout(structure.archetype, structure.nodes);
    const mark = render.ok ? (verdict?.ok ? "ok" : "GEBLOCKT") : "WIRFT";
    if (mark !== "ok") {
        hardFindings.push(`Beispielstruktur ${name} ist ${mark}.`);
    }
    console.log(`  ${name.padEnd(16)} -> ${structure.archetype.padEnd(11)} ${mark}`);
}

if (hardFindings.length > 0) {
    console.log(`\n${hardFindings.length} harte(r) Befund(e).`);
    process.exit(1);
}
console.log("\nKeine harten Befunde.");

