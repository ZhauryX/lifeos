import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getTasks,
  saveTasks,
  addTask,
  deleteTask,
  toggleTask,
  getSettings,
  saveSettings,
  loadDemo,
} from './storage'
import { Task, Settings } from '../types'

const mockTasks: Task[] = [
  {
    id: '1',
    name: 'Task 1',
    deadline: new Date().toISOString(),
    estimatedMinutes: 60,
    importance: 3,
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Task 2',
    deadline: new Date().toISOString(),
    estimatedMinutes: 30,
    importance: 5,
    completed: true,
    createdAt: new Date().toISOString(),
  },
]

const mockSettings: Settings = {
  availableMinutes: 120,
}

describe('storage.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('getTasks', () => {
    it('returns empty array when no tasks stored', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null)
      const tasks = getTasks()
      expect(tasks).toEqual([])
    })

    it('returns parsed tasks from localStorage', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(mockTasks))
      const tasks = getTasks()
      expect(tasks).toEqual(mockTasks)
    })

    it('returns empty array on parse error', () => {
      vi.mocked(localStorage.getItem).mockReturnValue('invalid json')
      const tasks = getTasks()
      expect(tasks).toEqual([])
    })
  })

  describe('saveTasks', () => {
    it('saves tasks to localStorage', () => {
      saveTasks(mockTasks)
      expect(localStorage.setItem).toHaveBeenCalledWith('lifeos_tasks', JSON.stringify(mockTasks))
    })
  })

  describe('addTask', () => {
    it('adds task to existing tasks', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(mockTasks))
      const newTask = {
        name: 'New Task',
        deadline: new Date().toISOString(),
        estimatedMinutes: 45,
        importance: 4,
      }
      addTask(newTask)
      expect(localStorage.setItem).toHaveBeenCalled()
      const saved = JSON.parse(vi.mocked(localStorage.setItem).mock.calls[0][1])
      expect(saved.length).toBe(3)
      expect(saved[2].name).toBe('New Task')
    })
  })

  describe('deleteTask', () => {
    it('removes task by id', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(mockTasks))
      deleteTask('1')
      const saved = JSON.parse(vi.mocked(localStorage.setItem).mock.calls[0][1])
      expect(saved.length).toBe(1)
      expect(saved[0].id).toBe('2')
    })
  })

  describe('toggleTask', () => {
    it('toggles completed status', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(mockTasks))
      toggleTask('1')
      const saved = JSON.parse(vi.mocked(localStorage.setItem).mock.calls[0][1])
      expect(saved[0].completed).toBe(true)
      expect(saved[1].completed).toBe(true)
    })
  })

  describe('getSettings', () => {
    it('returns default settings when none stored', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null)
      const settings = getSettings()
      expect(settings.availableMinutes).toBe(120)
    })

    it('returns stored settings', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify({ availableMinutes: 90 }))
      const settings = getSettings()
      expect(settings.availableMinutes).toBe(90)
    })
  })

  describe('saveSettings', () => {
    it('saves settings to localStorage', () => {
      saveSettings(mockSettings)
      expect(localStorage.setItem).toHaveBeenCalledWith('lifeos_settings', JSON.stringify(mockSettings))
    })
  })

  describe('loadDemo', () => {
    it('loads 4 demo tasks and 120min settings', () => {
      loadDemo()
      expect(localStorage.setItem).toHaveBeenCalledTimes(2)
      const tasksCall = vi.mocked(localStorage.setItem).mock.calls.find(c => c[0] === 'lifeos_tasks')
      const settingsCall = vi.mocked(localStorage.setItem).mock.calls.find(c => c[0] === 'lifeos_settings')
      expect(tasksCall).toBeDefined()
      expect(settingsCall).toBeDefined()
      const tasks = JSON.parse(tasksCall![1])
      expect(tasks.length).toBe(4)
      const settings = JSON.parse(settingsCall![1])
      expect(settings.availableMinutes).toBe(120)
    })
  })
})