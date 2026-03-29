import { describe, it, expect, vi } from 'vitest';
import type { DisciplineKey } from './types';
import { generateEventCSV, triggerCSVDownload } from './csvExport';
import type { FinalResult } from './csvExport';

describe('generateEventCSV', () => {
  it('Test 1: Single discipline with 2 results produces correct CSV format', () => {
    const disciplines: Record<DisciplineKey, FinalResult[]> = {
      mixed: [
        { position: 1, teamName: 'Team Alpha', placementLabel: '1st' },
        { position: 2, teamName: 'Team Beta', placementLabel: '2nd' },
      ],
      board: [],
      ladies: [],
    };

    const csv = generateEventCSV(disciplines);
    const lines = csv.split('\r\n');

    // Mixed section
    expect(lines[0]).toBe('--- Mixed ---');
    expect(lines[1]).toBe('#,Team,Placement');
    expect(lines[2]).toBe('1,Team Alpha,1st');
    expect(lines[3]).toBe('2,Team Beta,2nd');
    // Blank line separator
    expect(lines[4]).toBe('');
  });

  it('Test 2: All 3 disciplines with data separated by blank rows', () => {
    const disciplines: Record<DisciplineKey, FinalResult[]> = {
      mixed: [
        { position: 1, teamName: 'Team A', placementLabel: '1st' },
      ],
      board: [
        { position: 1, teamName: 'Team B', placementLabel: '1st' },
      ],
      ladies: [
        { position: 1, teamName: 'Team C', placementLabel: '1st' },
      ],
    };

    const csv = generateEventCSV(disciplines);
    const lines = csv.split('\r\n');

    // Mixed section
    expect(lines[0]).toBe('--- Mixed ---');
    expect(lines[1]).toBe('#,Team,Placement');
    expect(lines[2]).toBe('1,Team A,1st');
    expect(lines[3]).toBe('');

    // Board section
    expect(lines[4]).toBe('--- Board ---');
    expect(lines[5]).toBe('#,Team,Placement');
    expect(lines[6]).toBe('1,Team B,1st');
    expect(lines[7]).toBe('');

    // Ladies section
    expect(lines[8]).toBe('--- Ladies ---');
    expect(lines[9]).toBe('#,Team,Placement');
    expect(lines[10]).toBe('1,Team C,1st');
  });

  it('Test 3: Team name with comma is properly escaped', () => {
    const disciplines: Record<DisciplineKey, FinalResult[]> = {
      mixed: [
        { position: 1, teamName: 'Team A, The Great', placementLabel: '1st' },
      ],
      board: [],
      ladies: [],
    };

    const csv = generateEventCSV(disciplines);
    // papaparse should wrap the field in quotes
    expect(csv).toContain('"Team A, The Great"');
  });

  it('Test 4: Empty discipline array still shows discipline header with no data rows', () => {
    const disciplines: Record<DisciplineKey, FinalResult[]> = {
      mixed: [],
      board: [],
      ladies: [],
    };

    const csv = generateEventCSV(disciplines);
    const lines = csv.split('\r\n');

    expect(lines[0]).toBe('--- Mixed ---');
    expect(lines[1]).toBe('#,Team,Placement');
    expect(lines[2]).toBe('');
    expect(lines[3]).toBe('--- Board ---');
  });
});

describe('triggerCSVDownload', () => {
  it('Test 5: creates Blob with correct MIME type and triggers download', () => {
    // Mock DOM APIs
    const mockClick = vi.fn();
    const mockLink = {
      href: '',
      download: '',
      click: mockClick,
    };
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLElement);

    const mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    const mockRevokeObjectURL = vi.fn();
    globalThis.URL.createObjectURL = mockCreateObjectURL;
    globalThis.URL.revokeObjectURL = mockRevokeObjectURL;

    triggerCSVDownload('test,csv,data', 'kings-races-2026-03-28.csv');

    // Check Blob was created with correct type
    expect(mockCreateObjectURL).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'text/csv;charset=utf-8;',
      })
    );

    // Check link was configured correctly
    expect(mockLink.href).toBe('blob:mock-url');
    expect(mockLink.download).toBe('kings-races-2026-03-28.csv');

    // Check click was triggered
    expect(mockClick).toHaveBeenCalled();

    // Check URL was revoked
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');

    vi.restoreAllMocks();
  });
});
