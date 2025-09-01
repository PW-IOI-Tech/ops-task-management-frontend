// components/ParameterInputModal.tsx
'use client';
import React, { useState, useEffect, JSX } from 'react';
import { Task } from './task';

interface ParameterInputModalProps {
  selectedTask: Task | null;
  showModal: boolean;
  onClose: () => void;
  onSave: (value: string) => void;
}

const ParameterInputModal: React.FC<ParameterInputModalProps> = ({
  selectedTask,
  showModal,
  onClose,
  onSave
}) => {
  const [textValue, setTextValue] = useState<string>('');
  const [numberValue, setNumberValue] = useState<string>('');
  const [dateValue, setDateValue] = useState<string>('');
  const [timeValue, setTimeValue] = useState<string>('');
  const [readingValue, setReadingValue] = useState<string>('');
  const [readingTime, setReadingTime] = useState<string>('');

  useEffect(() => {
    if (showModal) {
      // Reset values when modal opens
      setTextValue('');
      setNumberValue('');
      setDateValue('');
      setTimeValue('');
      setReadingValue('');
      setReadingTime('');
    }
  }, [showModal]);

  const handleSave = (): void => {
    if (!selectedTask) return;
    
    let value = '';
    const paramType = selectedTask.parameterType;
    
    switch (paramType) {
      case 'text':
        value = textValue;
        break;
      case 'number':
        value = numberValue;
        break;
      case 'date':
        value = dateValue;
        break;
      case 'time':
        value = timeValue;
        break;
      case 'readings':
        value = `${readingValue} at ${readingTime}`;
        break;
      default:
        value = '';
    }
    
    onSave(value);
  };

  const renderParameterInput = (): JSX.Element | null => {
    if (!selectedTask) return null;
    
    const paramType = selectedTask.parameterType;
    
    switch (paramType) {
      case 'text':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Text Input</label>
            <input
              type="text"
              value={textValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTextValue(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter text..."
            />
          </div>
        );
      
      case 'number':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Number Input</label>
            <input
              type="number"
              value={numberValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumberValue(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter number..."
            />
          </div>
        );
      
      case 'date':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Input</label>
            <input
              type="date"
              value={dateValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateValue(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        );
      
      case 'time':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Input</label>
            <input
              type="time"
              value={timeValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTimeValue(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        );
      
      case 'readings':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reading Value</label>
              <input
                type="number"
                value={readingValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReadingValue(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter reading value..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reading Time</label>
              <input
                type="time"
                value={readingTime}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReadingTime(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Parameter Input</h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          {renderParameterInput()}
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParameterInputModal;