import { describe, it, expect, vi } from 'vitest'
import {
  calculateTaskScore,
  calculateRiskIfIgnored,
  scoreTasks,
  getNextMove,
  getRiskLevel,
  getTotalWorkload,
  calculateDaysUntilDeadline,
  calculateUrgency,
  calculateImportanceScore,
  calculateEfficiencyScore,
} from './scoring'
import { Task } from '../types'

const mockTask = (overrides: Partial<Task> = {}): Task => ({
  id: '1',
  name: 'Test Task',
  deadline: new Date(Date.now() + 86400000).toISOString(),
  estimatedMinutes: 60,
  importance: 3,
  completed: false,
  createdAt: new Date().toISOString(),
  ...overrides,
})

describe('scoring.ts', () => {
  describe('calculateDaysUntilDeadline', () => {
    it('returns 0 for past deadlines', () => {
      const past = new Date(Date.now() - 86400000).toISOString()
      expect(calculateDaysUntilDeadline(past)).toBe(0)
    })

    it('returns 1 for tomorrow', () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString()
      expect(calculateDaysUntilDeadline(tomorrow)).toBe(1)
    })

    it('returns correct days for future dates', () => {
      const future = new Date(Date.now() + 5 * 86400000).toISOString()
      expect(calculateDaysUntilDeadline(future)).toBe(5)
    })
  })

  describe('calculateUrgency', () => {
    it('returns 100 for today (0 days)', () => {
      expect(calculateUrgency(0)).toBe(100)
    })
    it('returns 80 for tomorrow (1 day)', () => {
      expect(calculateUrgency(1)).toBe(80)
    })
    it('returns 60 for 2 days', () => {
      expect(calculateUrgency(2)).toBe(60)
    })
    it('returns 45 for 3 days', () => {
      expect(calculateUrgency(3)).toBe(45)
    })
    it('returns 30 for <=5 days', () => {
      expect(calculateUrgency(5)).toBe(30)
    })
    it('returns 20 for <=7 days', () => {
      expect(calculateUrgency(7)).toBe(20)
    })
    it('returns 10 for later', () => {
      expect(calculateUrgency(10)).toBe(10)
    })
  })

  describe('calculateImportanceScore', () => {
    it('returns 15 per importance level', () => {
      expect(calculateImportanceScore(1)).toBe(15)
      expect(calculateImportanceScore(3)).toBe(45)
      expect(calculateImportanceScore(5)).toBe(75)
    })
  })

  describe('calculateEfficiencyScore', () => {
    it('returns 20 for <=30 min', () => {
      expect(calculateEfficiencyScore(15)).toBe(20)
      expect(calculateEfficiencyScore(30)).toBe(20)
    })
    it('returns 15 for <=60 min', () => {
      expect(calculateEfficiencyScore(45)).toBe(15)
      expect(calculateEfficiencyScore(60)).toBe(15)
    })
    it('returns 10 for <=120 min', () => {
      expect(calculateEfficiencyScore(90)).toBe(10)
      expect(calculateEfficiencyScore(120)).toBe(10)
    })
    it('returns 5 for >120 min', () => {
      expect(calculateEfficiencyScore(180)).toBe(5)
      expect(calculateEfficiencyScore(240)).toBe(5)
    })
  })

  describe('calculateTaskScore', () => {
    it('calculates score correctly for urgent, important, quick task', () => {
      const task = mockTask({
        deadline: new Date().toISOString(),
        importance: 5,
        estimatedMinutes: 15,
      })
      const score = calculateTaskScore(task)
      // urgency=100*0.5=50, importance=75*0.35=26.25, efficiency=20*0.15=3 => 79.25 -> 79
      expect(score).toBe(79)
    })

    it('returns lower score for distant deadline', () => {
      const task = mockTask({
        deadline: new Date(Date.now() + 10 * 86400000).toISOString(),
        importance: 5,
        estimatedMinutes: 15,
      })
      const score = calculateTaskScore(task)
      // urgency=10*0.5=5, importance=75*0.35=26.25, efficiency=20*0.15=3 => 34.25 -> 34
      expect(score).toBe(34)
    })

    it('returns lower score for low importance', () => {
      const task = mockTask({
        deadline: new Date().toISOString(),
        importance: 1,
        estimatedMinutes: 15,
      })
      const score = calculateTaskScore(task)
      // urgency=100*0.5=50, importance=15*0.35=5.25, efficiency=20*0.15=3 => 58.25 -> 58
      expect(score).toBe(58)
    })

    it('returns lower score for long duration', () => {
      const task = mockTask({
        deadline: new Date().toISOString(),
        importance: 5,
        estimatedMinutes: 240,
      })
      const score = calculateTaskScore(task)
      // urgency=100*0.5=50, importance=75*0.35=26.25, efficiency=5*0.15=0.75 => 77 -> 77
      expect(score).toBe(77)
    })

    it('still calculates score for completed tasks (filtering happens in scoreTasks)', () => {
      const task = mockTask({ completed: true })
      const score = calculateTaskScore(task)
      expect(score).toBeGreaterThan(0)
    })
  })

  describe('calculateRiskIfIgnored', () => {
    it('returns higher risk for urgent tasks', () => {
      const task = mockTask({ deadline: new Date().toISOString(), importance: 5, estimatedMinutes: 60 })
      const risk = calculateRiskIfIgnored(task, 120)
      // baseRisk=100, timePressure=min(50, 60/120*100)=50, importanceRisk=50
      // 100 + 50*0.3 + 50 = 165 -> min(100, 165) = 100
      expect(risk).toBe(100)
    })

    it('returns lower risk for non-urgent tasks', () => {
      const task = mockTask({ deadline: new Date(Date.now() + 10 * 86400000).toISOString(), importance: 1, estimatedMinutes: 30 })
      const risk = calculateRiskIfIgnored(task, 120)
      // baseRisk=10, timePressure=min(50, 30/120*100)=25, importanceRisk=10
      // 10 + 25*0.3 + 10 = 27.5 -> 28
      expect(risk).toBe(28)
    })
  })

  describe('scoreTasks', () => {
    it('sorts tasks by score descending', () => {
      const tasks = [
        mockTask({ id: '1', deadline: new Date(Date.now() + 5 * 86400000).toISOString(), importance: 1, estimatedMinutes: 120 }),
        mockTask({ id: '2', deadline: new Date().toISOString(), importance: 5, estimatedMinutes: 15 }),
      ]
      const scored = scoreTasks(tasks, 120)
      expect(scored[0].id).toBe('2')
      expect(scored[0].score).toBeGreaterThan(scored[1].score)
    })

    it('excludes completed tasks from scored results', () => {
      const tasks = [
        mockTask({ id: '1', completed: true }),
        mockTask({ id: '2', completed: false }),
      ]
      const scored = scoreTasks(tasks, 120)
      expect(scored.length).toBe(1)
      expect(scored[0].id).toBe('2')
    })

    it('adds score, urgency, riskIfIgnored, daysUntilDeadline, reason to each task', () => {
      const tasks = [mockTask()]
      const scored = scoreTasks(tasks, 120)
      expect(scored[0]).toHaveProperty('score')
      expect(scored[0]).toHaveProperty('urgency')
      expect(scored[0]).toHaveProperty('riskIfIgnored')
      expect(scored[0]).toHaveProperty('daysUntilDeadline')
      expect(scored[0]).toHaveProperty('reason')
    })
  })

  describe('getNextMove', () => {
    it('returns highest scored pending task', () => {
      const tasks = [
        mockTask({ id: '1', deadline: new Date(Date.now() + 5 * 86400000).toISOString(), importance: 1 }),
        mockTask({ id: '2', deadline: new Date().toISOString(), importance: 5 }),
      ]
      const next = getNextMove(tasks, 120)
      expect(next?.id).toBe('2')
    })

    it('returns null when no pending tasks', () => {
      const tasks = [mockTask({ completed: true })]
      const next = getNextMove(tasks, 120)
      expect(next).toBeNull()
    })
  })

  describe('getRiskLevel', () => {
    it('returns critical for ratio >= 3', () => {
      expect(getRiskLevel(360, 120)).toBe('critical') // 360/120 = 3
    })
    it('returns high for ratio >= 2', () => {
      expect(getRiskLevel(240, 120)).toBe('high') // 240/120 = 2
    })
    it('returns medium for ratio >= 1', () => {
      expect(getRiskLevel(120, 120)).toBe('medium') // 120/120 = 1
    })
    it('returns low for ratio < 1', () => {
      expect(getRiskLevel(60, 120)).toBe('low') // 60/120 = 0.5
    })
  })

  describe('getTotalWorkload', () => {
    it('sums estimated minutes of pending tasks only', () => {
      const tasks = [
        mockTask({ estimatedMinutes: 60, completed: false }),
        mockTask({ estimatedMinutes: 30, completed: true }),
        mockTask({ estimatedMinutes: 45, completed: false }),
      ]
      expect(getTotalWorkload(tasks)).toBe(105)
    })
  })
})