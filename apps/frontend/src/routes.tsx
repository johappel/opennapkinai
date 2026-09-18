import { Routes, Route } from "react-router";
import { NotesPage } from "./components/pages/NotesPage";
import { NoteEditorPage } from "./components/pages/NoteEditorPage";
import { SmartArtPlaygroundPage } from "./components/pages/SmartArtPlaygroundPage";

export default function AppRoutes(){
    return (
        <Routes>
            <Route index element={<NotesPage />} />
            <Route path="/workshop" element={<SmartArtPlaygroundPage />} />
            <Route path="/:id" element={<NoteEditorPage />} />
        </Routes>
    );
}
