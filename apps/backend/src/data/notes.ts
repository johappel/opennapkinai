import { Note } from '@repo/types';

export const notes: Note[] = [];

export const getNoteById = (id: string): Note | undefined => {
    return notes.find(note => note.id === id);
};

export const getAllNotes = (): Note[] => {
    return notes;
};

/**
 * Legt eine Notiz an. Ist die Id schon vergeben, wird der vorhandene Eintrag
 * ersetzt statt ein zweiter daneben gestellt.
 *
 * Das Frontend speichert ueber POST, sobald die Notiz in seiner Liste fehlt.
 * Diese Liste ist der Client-Zustand und kann hinterherhinken, etwa wenn eine
 * Notiz in einem anderen Reiter entstanden ist oder wenn nach dem Neuladen noch
 * abgefragt wird. Ohne die Pruefung entstehen dann zwei Eintraege mit derselben
 * Id, und `getNoteById` liefert dauerhaft den aelteren davon: die Notiz sieht
 * gespeichert aus und ist trotzdem unauffindbar.
 */
export const createNote = (note: Note): void => {
    const existing = notes.findIndex(candidate => candidate.id === note.id);
    if (existing !== -1) {
        notes[existing] = note;
        return;
    }
    notes.push(note);
};

export const deleteNoteById = (id: string): boolean => {
    const index = notes.findIndex(note => note.id === id);
    if (index !== -1) {
        notes.splice(index, 1);
        return true;
    }
    return false;
};

export const updateNote = (id: string, updatedNote: Partial<Note>): Note | undefined => {
    const note = getNoteById(id);
    if (note) {
        Object.assign(note, updatedNote);
        return note;
    }
    return undefined;
};
