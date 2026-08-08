import type { SmartArtStructure } from "./types";

/**
 * Mock structures used to test the SmartArt renderer without a backend call.
 * Multiple node counts per archetype are included to prove the layout is generative,
 * not a fixed picture.
 */
export const MOCK_STRUCTURES: Record<string, SmartArtStructure> = {
    "process-3": {
        archetype: "process",
        nodes: [
            { id: "p1", title: "Research", content: "Gather requirements and study the competitive landscape." },
            { id: "p2", title: "Design", content: "Sketch wireframes and validate the core user flows." },
            { id: "p3", title: "Ship", content: "Release to production and monitor adoption metrics." },
        ],
    },
    "process-5": {
        archetype: "process",
        nodes: [
            { id: "p1", title: "Discover", content: "Identify the problem worth solving." },
            { id: "p2", title: "Define", content: "Write a clear problem statement and success metrics." },
            { id: "p3", title: "Design", content: "Explore solutions and prototype the best option." },
            { id: "p4", title: "Develop", content: "Build, test, and iterate on the chosen solution." },
            { id: "p5", title: "Deliver", content: "Launch, measure impact, and gather feedback." },
        ],
    },
    "cycle-4": {
        archetype: "cycle",
        nodes: [
            { id: "c1", title: "Plan", content: "Set goals for the sprint." },
            { id: "c2", title: "Build", content: "Implement the planned features." },
            { id: "c3", title: "Review", content: "Demo and collect feedback." },
            { id: "c4", title: "Improve", content: "Refine the backlog for next cycle." },
        ],
    },
    "cycle-6": {
        archetype: "cycle",
        nodes: [
            { id: "c1", title: "Awareness", content: "Customer notices a need." },
            { id: "c2", title: "Consideration", content: "Customer compares options." },
            { id: "c3", title: "Purchase", content: "Customer buys the product." },
            { id: "c4", title: "Onboarding", content: "Customer learns to use it." },
            { id: "c5", title: "Retention", content: "Customer keeps getting value." },
            { id: "c6", title: "Advocacy", content: "Customer recommends it to others." },
        ],
    },
    "hierarchy-org": {
        archetype: "hierarchy",
        nodes: [
            { id: "h1", title: "CEO", content: "Sets overall company vision.", parentId: null },
            { id: "h2", title: "VP Engineering", content: "Owns product delivery.", parentId: "h1" },
            { id: "h3", title: "VP Sales", content: "Owns revenue growth.", parentId: "h1" },
            { id: "h4", title: "Frontend Lead", content: "Owns client apps.", parentId: "h2" },
            { id: "h5", title: "Backend Lead", content: "Owns platform services.", parentId: "h2" },
            { id: "h6", title: "Sales Manager", content: "Owns regional sales team.", parentId: "h3" },
        ],
    },
    "pyramid-4": {
        archetype: "pyramid",
        nodes: [
            { id: "py1", title: "Vision", content: "The long-term direction." },
            { id: "py2", title: "Strategy", content: "The plan to achieve the vision." },
            { id: "py3", title: "Tactics", content: "The concrete initiatives." },
            { id: "py4", title: "Daily Actions", content: "The tasks executed every day." },
        ],
    },
    "matrix-4": {
        archetype: "matrix",
        nodes: [
            { id: "m1", title: "Urgent & Important", content: "Do these tasks first." },
            { id: "m2", title: "Important, Not Urgent", content: "Schedule time for these." },
            { id: "m3", title: "Urgent, Not Important", content: "Delegate these if possible." },
            { id: "m4", title: "Neither", content: "Eliminate these tasks." },
        ],
    },
    "comparison-4": {
        archetype: "comparison",
        nodes: [
            { id: "co1", title: "Remote Work", content: "Flexible schedule and location." },
            { id: "co2", title: "Office Work", content: "In-person collaboration daily." },
            { id: "co3", title: "Async Communication", content: "Fewer meetings, more writing." },
            { id: "co4", title: "Sync Communication", content: "Faster decisions in real time." },
        ],
    },
};

export type MockStructureKey = keyof typeof MOCK_STRUCTURES;
