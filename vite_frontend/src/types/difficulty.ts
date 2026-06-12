export type DifficultyId = 'beginner' | 'intermediate' | 'expert'

export type DifficultyPreset = {
  id: DifficultyId
  label: string
  rows: number
  cols: number
  mines: number
}

// PUBLIC_INTERFACE
export const DIFFICULTY_PRESETS: Record<DifficultyId, DifficultyPreset> = {
  beginner: { id: 'beginner', label: 'Beginner', rows: 9, cols: 9, mines: 10 },
  intermediate: { id: 'intermediate', label: 'Intermediate', rows: 16, cols: 16, mines: 40 },
  expert: { id: 'expert', label: 'Expert', rows: 16, cols: 30, mines: 99 }
}
