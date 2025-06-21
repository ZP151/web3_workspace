import React, { useState } from 'react';
import { formatEther } from 'viem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface FormData {
  title: string;
  description: string;
  duration: string;
  minVotes: string;
  proposalType: number;
  category: number;
  options: string[];
}

interface CreateProposalFormProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  isCreating: boolean;
  creationFee?: bigint;
}

export default function CreateProposalForm({ 
  show, 
  onClose, 
  onSubmit, 
  isCreating, 
  creationFee 
}: CreateProposalFormProps) {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    duration: '168',
    minVotes: '10',
    proposalType: 0,
    category: 0,
    options: ['']
  });

  const handleSubmit = () => {
    onSubmit(formData);
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const updateOption = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => i === index ? value : option)
    }));
  };

  if (!show) return null;

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Create New Proposal</CardTitle>
        <CardDescription>
          Creation Fee: {creationFee ? formatEther(creationFee) : '0.001'} ETH
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Proposal Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter proposal title"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Proposal Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe your proposal in detail"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Voting Type</label>
            <select 
              value={formData.proposalType.toString()} 
              onChange={(e) => setFormData(prev => ({ ...prev, proposalType: Number(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="0">Simple Vote</option>
              <option value="1">Multiple Choice</option>
              <option value="2">Weighted Vote</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Proposal Category</label>
            <select 
              value={formData.category.toString()} 
              onChange={(e) => setFormData(prev => ({ ...prev, category: Number(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="0">Governance</option>
              <option value="1">Finance</option>
              <option value="2">Technical</option>
              <option value="3">Community</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Voting Duration (Hours)</label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
              min="1"
              max="720"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Minimum Votes Required</label>
          <input
            type="number"
            value={formData.minVotes}
            onChange={(e) => setFormData(prev => ({ ...prev, minVotes: e.target.value }))}
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {formData.proposalType === 1 && (
          <div>
            <label className="block text-sm font-medium mb-2">Voting Options</label>
            {formData.options.map((option, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {formData.options.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeOption(index)}
                    className="px-3"
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            {formData.options.length < 10 && (
              <Button
                type="button"
                variant="outline"
                onClick={addOption}
                className="mt-2"
              >
                Add Option
              </Button>
            )}
          </div>
        )}

        <div className="flex gap-4">
          <Button
            onClick={handleSubmit}
            disabled={isCreating || !formData.title.trim() || !formData.description.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isCreating ? 'Creating...' : 'Create Proposal'}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 