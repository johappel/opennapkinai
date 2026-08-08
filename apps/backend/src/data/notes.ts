import { Note } from '@repo/types';

export const notes: Note[] = [];

export const getNoteById = (id: string): Note | undefined => {
    return notes.find(note => note.id === id);
};

export const getAllNotes = (): Note[] => {
    return notes;
};

export const createNote = (note: Note): void => {
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
