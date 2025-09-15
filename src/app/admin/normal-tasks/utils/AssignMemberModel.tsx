'use client';
import React, { useState, useEffect } from 'react';
import { XMarkIcon, UserPlusIcon, CheckIcon, UserIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface AssignedMember {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

interface AssignMemberModalProps {
  taskId: string;
  taskTitle: string;
  assignedMembers: AssignedMember[]; // ✅ NEW: Receive assigned members from parent
  onClose: () => void;
  onAssignMembers: (memberIds: string[]) => void;
}

const AssignMemberModal: React.FC<AssignMemberModalProps> = ({
  taskId,
  taskTitle,
  assignedMembers: initialAssignedMembers, // ✅ Rename to avoid confusion
  onClose,
  onAssignMembers
}) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [assignedMembers, setAssignedMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  // ✅ Fetch only members, no task API call needed
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all members only
        const membersResponse = await axios.get(`${backendUrl}/api/users/members`, {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        });

        if (membersResponse.data.success) {
          setMembers(membersResponse.data.data);
        } else {
          setError('Failed to fetch members');
          return;
        }

        // ✅ Process assigned members from props instead of API
        const assignedMemberIds = initialAssignedMembers.map(member => member.id);
        const uniqueAssignedMemberIds = [...new Set(assignedMemberIds)] as string[];
        
        console.log('Already assigned members from parent:', uniqueAssignedMemberIds);
        
        setAssignedMembers(uniqueAssignedMemberIds);
        setSelectedMembers(uniqueAssignedMemberIds); // Pre-select already assigned members

      } catch (error: unknown) {
        console.error('Error fetching members:', error);
        setError('Failed to load members. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [taskId, backendUrl, initialAssignedMembers]);

  const handleMemberToggle = (memberId: string) => {
    // Don't allow deselecting already assigned members
    if (assignedMembers.includes(memberId)) {
      return;
    }

    setSelectedMembers(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleAssignMembers = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Only assign new members (not already assigned ones)
      const newMemberIds = selectedMembers.filter(id => !assignedMembers.includes(id));

      if (newMemberIds.length === 0) {
        setError('No new members selected for assignment');
        return;
      }

      console.log('Assigning new members:', newMemberIds);

      const response = await axios.post(`${backendUrl}/api/assignments`, {
        taskId: taskId,
        userIds: newMemberIds
      }, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.status === 200 || response.status === 201) {
        console.log('Assignment successful:', response.data);
        onAssignMembers(selectedMembers);
        onClose();
      }
    } catch (error: unknown) {
      console.error('Error assigning members:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 409) {
          setError('Some selected members are already assigned to this task');
        } else if (error.response?.data?.message) {
          setError(error.response.data.message);
        } else {
          setError('Failed to assign members. Please try again.');
        }
      } else {
        setError('Failed to assign members. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getMemberStatus = (memberId: string) => {
    if (assignedMembers.includes(memberId)) {
      return 'assigned';
    } else if (selectedMembers.includes(memberId)) {
      return 'selected';
    }
    return 'available';
  };

  // ✅ Get member name for display - check both members list and assigned members from parent
  const getMemberName = (memberId: string) => {
    // First try to find in full members list
    const member = members.find(m => m.id === memberId);
    if (member) {
      return `${member.firstName} ${member.lastName}`;
    }
    
    // If not found in members, try assigned members from parent (fallback)
    const assignedMember = initialAssignedMembers.find(m => m.id === memberId);
    if (assignedMember) {
      return `${assignedMember.firstName} ${assignedMember.lastName}`;
    }
    
    return 'Unknown Member';
  };

  // ✅ Get unique assigned members for display
  const getUniqueAssignedMembers = () => {
    return [...new Set(assignedMembers)];
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <UserPlusIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Assign Members</h3>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{taskTitle}</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
              disabled={submitting}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading members...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Select members to assign to this task. Already assigned members are marked and cannot be deselected.
                </p>
                {assignedMembers.length > 0 && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800 mb-1">Currently Assigned:</p>
                    <div className="flex flex-wrap gap-1">
                      {getUniqueAssignedMembers().map((memberId, index) => (
                        <span 
                          key={`assigned-${memberId}-${index}`} 
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"
                        >
                          {getMemberName(memberId)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {members.length === 0 ? (
                <div className="text-center py-8">
                  <UserIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No members available</p>
                </div>
              ) : (
                members.map((member) => {
                  const status = getMemberStatus(member.id);
                  
                  return (
                    <div
                      key={member.id}
                      className={`
                        flex items-center justify-between p-3 rounded-lg border transition-all duration-200 cursor-pointer
                        ${status === 'assigned' 
                          ? 'bg-green-50 border-green-200 cursor-not-allowed' 
                          : status === 'selected'
                          ? 'bg-blue-50 border-blue-300 hover:bg-blue-100'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                        }
                      `}
                      onClick={() => handleMemberToggle(member.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="bg-white p-2 rounded-full shadow-sm">
                          <UserIcon className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {member.firstName} {member.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{member.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {status === 'assigned' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Already Assigned
                          </span>
                        )}
                        
                        <div
                          className={`
                            w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                            ${status === 'assigned'
                              ? 'bg-green-500 border-green-500'
                              : status === 'selected'
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-gray-300 hover:border-gray-400'
                            }
                          `}
                        >
                          {(status === 'assigned' || status === 'selected') && (
                            <CheckIcon className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && !error && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-xl">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
                {assignedMembers.length > 0 && (
                  <span className="ml-2 text-green-600">
                    ({getUniqueAssignedMembers().length} already assigned)
                  </span>
                )}
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-5 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-150 font-medium"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignMembers}
                disabled={
                  submitting || 
                  selectedMembers.length === 0 || 
                  selectedMembers.every(id => assignedMembers.includes(id))
                }
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150 flex items-center font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <UserPlusIcon className="w-4 h-4 mr-2" />
                )}
                {submitting ? 'Assigning...' : 'Assign Members'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignMemberModal;
