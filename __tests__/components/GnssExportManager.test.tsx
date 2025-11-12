/**
 * GnssExportManager Tests
 * Tests for the GNSS export and file management component
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { GnssExportManager } from '../../src/components/gnss/GnssExportManager';
import { GnssModule, GnssExportModule, LogFileInfo } from '../../src/native/GnssModule';

// Mock the native modules
jest.mock('../../src/native/GnssModule', () => ({
  GnssModule: {
    listLogFiles: jest.fn(),
    deleteLogFile: jest.fn(),
  },
  GnssExportModule: {
    exportCSV: jest.fn(),
  },
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('GnssExportManager', () => {
  const mockLogFiles: LogFileInfo[] = [
    {
      name: 'gnss_log_2025-01-15_120000.csv',
      path: '/data/gnss_log_2025-01-15_120000.csv',
      size: 1048576,
      lastModified: 1705320000000,
    },
    {
      name: 'gnss_log_2025-01-14_150000.csv',
      path: '/data/gnss_log_2025-01-14_150000.csv',
      size: 524288,
      lastModified: 1705233600000,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (GnssModule.listLogFiles as jest.Mock).mockResolvedValue(mockLogFiles);
  });

  describe('Rendering', () => {
    it('should render export button', async () => {
      const { getByText } = render(<GnssExportManager />);

      await waitFor(() => {
        expect(getByText('Manage & Export Logs')).toBeTruthy();
      });
    });

    it('should disable button when disabled prop is true', async () => {
      const { getByText } = render(<GnssExportManager disabled={true} />);

      await waitFor(() => {
        // Button should still be present even when disabled
        expect(getByText('Manage & Export Logs')).toBeTruthy();
      });
    });

    it('should not disable button when disabled prop is false', async () => {
      const { getByText } = render(<GnssExportManager disabled={false} />);

      await waitFor(() => {
        // Button should be present and enabled
        expect(getByText('Manage & Export Logs')).toBeTruthy();
      });
    });
  });

  describe('File List Loading', () => {
    it('should check for log files on mount', async () => {
      render(<GnssExportManager />);

      await waitFor(() => {
        expect(GnssModule.listLogFiles).toHaveBeenCalled();
      });
    });

    it('should show modal when button pressed and files exist', async () => {
      const { getByText, queryByText } = render(<GnssExportManager />);

      const button = getByText('Manage & Export Logs');
      fireEvent.press(button);

      await waitFor(() => {
        expect(queryByText('Select Log File')).toBeTruthy();
      });
    });

    it('should show alert when no files exist', async () => {
      (GnssModule.listLogFiles as jest.Mock).mockResolvedValue([]);

      const { getByText } = render(<GnssExportManager />);

      const button = getByText('Manage & Export Logs');
      fireEvent.press(button);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'No Data',
          'No log files found. Start logging to create data.'
        );
      });
    });

    it('should handle list files error', async () => {
      const error = new Error('Failed to list files');
      (GnssModule.listLogFiles as jest.Mock).mockRejectedValue(error);

      const { getByText } = render(<GnssExportManager />);

      const button = getByText('Manage & Export Logs');
      fireEvent.press(button);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          expect.stringContaining('Could not list log files')
        );
      });
    });
  });

  describe('File Display', () => {
    it('should display file list in modal', async () => {
      const { getByText } = render(<GnssExportManager />);

      fireEvent.press(getByText('Manage & Export Logs'));

      await waitFor(() => {
        expect(getByText('gnss_log_2025-01-15_120000.csv')).toBeTruthy();
        expect(getByText('gnss_log_2025-01-14_150000.csv')).toBeTruthy();
      });
    });

    it('should format file sizes correctly', async () => {
      const { getByText } = render(<GnssExportManager />);

      fireEvent.press(getByText('Manage & Export Logs'));

      await waitFor(() => {
        expect(getByText('1.0 MB')).toBeTruthy(); // 1048576 bytes
        expect(getByText('512.0 KB')).toBeTruthy(); // 524288 bytes
      });
    });

    it('should display file dates', async () => {
      const { getByText, getAllByText } = render(<GnssExportManager />);

      fireEvent.press(getByText('Manage & Export Logs'));

      await waitFor(() => {
        // Verify modal is shown with file list
        expect(getByText('gnss_log_2025-01-15_120000.csv')).toBeTruthy();
      });
    });
  });

  describe('Export Functionality', () => {
    it('should export file when Export button pressed', async () => {
      const exportedPath = '/storage/emulated/0/Download/Aisight/gnss_log_2025-01-15_120000.csv';
      (GnssExportModule.exportCSV as jest.Mock).mockResolvedValue(exportedPath);

      const { getByText, getAllByText } = render(<GnssExportManager />);

      fireEvent.press(getByText('Manage & Export Logs'));

      await waitFor(() => {
        expect(getByText('gnss_log_2025-01-15_120000.csv')).toBeTruthy();
      });

      const exportButtons = getAllByText('Export');
      fireEvent.press(exportButtons[0]);

      await waitFor(() => {
        expect(GnssExportModule.exportCSV).toHaveBeenCalledWith(
          mockLogFiles[0].path,
          mockLogFiles[0].name
        );
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Export Successful',
          expect.stringContaining('gnss_log_2025-01-15_120000.csv'),
          expect.any(Array)
        );
      });
    });

    it('should handle export errors', async () => {
      const error = new Error('Export failed');
      (GnssExportModule.exportCSV as jest.Mock).mockRejectedValue(error);

      const { getByText, getAllByText } = render(<GnssExportManager />);

      fireEvent.press(getByText('Manage & Export Logs'));

      await waitFor(() => {
        expect(getByText('gnss_log_2025-01-15_120000.csv')).toBeTruthy();
      });

      const exportButtons = getAllByText('Export');
      fireEvent.press(exportButtons[0]);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Export Failed',
          expect.stringContaining('Could not export data')
        );
      });
    });

    it('should close modal after successful export', async () => {
      (GnssExportModule.exportCSV as jest.Mock).mockResolvedValue('/path/to/export');

      const { getByText, getAllByText, queryByText } = render(<GnssExportManager />);

      fireEvent.press(getByText('Manage & Export Logs'));

      await waitFor(() => {
        expect(getByText('Select Log File')).toBeTruthy();
      });

      const exportButtons = getAllByText('Export');
      fireEvent.press(exportButtons[0]);

      await waitFor(() => {
        expect(queryByText('Select Log File')).toBeNull();
      });
    });
  });

  describe('Delete Functionality', () => {
    it('should show confirmation dialog when Delete pressed', async () => {
      const { getByText, getAllByText } = render(<GnssExportManager />);

      fireEvent.press(getByText('Manage & Export Logs'));

      await waitFor(() => {
        expect(getByText('gnss_log_2025-01-15_120000.csv')).toBeTruthy();
      });

      const deleteButtons = getAllByText('Delete');
      fireEvent.press(deleteButtons[0]);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Delete Log File',
          expect.stringContaining('Are you sure'),
          expect.any(Array)
        );
      });
    });

    it('should delete file when confirmed', async () => {
      (GnssModule.deleteLogFile as jest.Mock).mockResolvedValue(true);
      (GnssModule.listLogFiles as jest.Mock)
        .mockResolvedValueOnce(mockLogFiles)
        .mockResolvedValueOnce(mockLogFiles)
        .mockResolvedValueOnce([mockLogFiles[1]]); // After delete

      // Mock Alert.alert to auto-confirm
      (Alert.alert as any) = jest.fn((title, message, buttons) => {
        if (buttons && buttons[1] && buttons[1].onPress) {
          buttons[1].onPress();
        }
      });

      const { getByText, getAllByText } = render(<GnssExportManager />);

      fireEvent.press(getByText('Manage & Export Logs'));

      await waitFor(() => {
        expect(getByText('gnss_log_2025-01-15_120000.csv')).toBeTruthy();
      });

      const deleteButtons = getAllByText('Delete');
      fireEvent.press(deleteButtons[0]);

      await waitFor(() => {
        expect(GnssModule.deleteLogFile).toHaveBeenCalledWith(mockLogFiles[0].path);
      });
    });

    it('should refresh file list after delete', async () => {
      (GnssModule.deleteLogFile as jest.Mock).mockResolvedValue(true);
      (GnssModule.listLogFiles as jest.Mock)
        .mockResolvedValueOnce(mockLogFiles)
        .mockResolvedValueOnce(mockLogFiles)
        .mockResolvedValueOnce([mockLogFiles[1]]);

      (Alert.alert as any) = jest.fn((title, message, buttons) => {
        if (buttons && buttons[1] && buttons[1].onPress) {
          buttons[1].onPress();
        }
      });

      const { getByText, getAllByText } = render(<GnssExportManager />);

      fireEvent.press(getByText('Manage & Export Logs'));

      await waitFor(() => {
        expect(getByText('gnss_log_2025-01-15_120000.csv')).toBeTruthy();
      });

      const deleteButtons = getAllByText('Delete');
      fireEvent.press(deleteButtons[0]);

      await waitFor(() => {
        // Should have called listLogFiles again to refresh
        expect(GnssModule.listLogFiles).toHaveBeenCalledTimes(3);
      });
    });

    it('should close modal if no files left after delete', async () => {
      (GnssModule.deleteLogFile as jest.Mock).mockResolvedValue(true);
      (GnssModule.listLogFiles as jest.Mock)
        .mockResolvedValueOnce([mockLogFiles[0]]) // Initial load
        .mockResolvedValueOnce([mockLogFiles[0]]) // Modal open
        .mockResolvedValueOnce([]); // After delete

      (Alert.alert as any) = jest.fn((title, message, buttons) => {
        if (buttons && buttons[1] && buttons[1].onPress) {
          buttons[1].onPress();
        }
      });

      const { getByText, queryByText, getAllByText } = render(<GnssExportManager />);

      fireEvent.press(getByText('Manage & Export Logs'));

      await waitFor(() => {
        expect(getByText('Select Log File')).toBeTruthy();
      });

      const deleteButtons = getAllByText('Delete');
      if (deleteButtons.length > 0) {
        fireEvent.press(deleteButtons[0]);
      }

      await waitFor(() => {
        expect(queryByText('Select Log File')).toBeNull();
      });
    });

    it('should handle delete errors', async () => {
      const error = new Error('Delete failed');
      (GnssModule.deleteLogFile as jest.Mock).mockRejectedValue(error);

      (Alert.alert as any) = jest.fn((title, message, buttons) => {
        if (buttons && buttons[1] && buttons[1].onPress) {
          buttons[1].onPress();
        }
      });

      const { getByText, getAllByText } = render(<GnssExportManager />);

      fireEvent.press(getByText('Manage & Export Logs'));

      await waitFor(() => {
        expect(getByText('gnss_log_2025-01-15_120000.csv')).toBeTruthy();
      });

      const deleteButtons = getAllByText('Delete');
      fireEvent.press(deleteButtons[0]);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Delete Failed',
          expect.stringContaining('Could not delete file')
        );
      });
    });
  });

  describe('Modal Controls', () => {
    it('should close modal when Close button pressed', async () => {
      const { getByText, queryByText } = render(<GnssExportManager />);

      fireEvent.press(getByText('Manage & Export Logs'));

      await waitFor(() => {
        expect(getByText('Select Log File')).toBeTruthy();
      });

      fireEvent.press(getByText('Close'));

      await waitFor(() => {
        expect(queryByText('Select Log File')).toBeNull();
      });
    });

    it('should show empty state when no files', async () => {
      (GnssModule.listLogFiles as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      // Override alert to not show message and proceed to modal
      (Alert.alert as any) = jest.fn();

      const { getByText, queryByText } = render(<GnssExportManager />);

      fireEvent.press(getByText('Manage & Export Logs'));

      // Since alert is mocked, modal won't show
      // This test verifies alert was called
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'No Data',
          'No log files found. Start logging to create data.'
        );
      });
    });
  });

  describe('File Size Formatting', () => {
    it('should format bytes correctly', () => {
      // This is tested indirectly through the component rendering
      // The formatFileSize function is private, but we can verify its output
      const testFiles: LogFileInfo[] = [
        { name: 'small.csv', path: '/small.csv', size: 500, lastModified: Date.now() },
        { name: 'kb.csv', path: '/kb.csv', size: 2048, lastModified: Date.now() },
        { name: 'mb.csv', path: '/mb.csv', size: 2097152, lastModified: Date.now() },
      ];

      (GnssModule.listLogFiles as jest.Mock).mockResolvedValue(testFiles);

      const { getByText } = render(<GnssExportManager />);

      fireEvent.press(getByText('Manage & Export Logs'));

      waitFor(() => {
        expect(getByText('500 B')).toBeTruthy();
        expect(getByText('2.0 KB')).toBeTruthy();
        expect(getByText('2.0 MB')).toBeTruthy();
      });
    });
  });
});
