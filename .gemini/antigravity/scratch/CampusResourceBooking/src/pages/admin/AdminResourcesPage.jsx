import { useState } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useResources } from '../../hooks/useResources';
import { useToast } from '../../context/ToastContext';
import {
  createResource,
  updateResource,
  toggleResourceStatus,
  deleteResource,
} from '../../services/resourceService';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmDialog from '../../components/ConfirmDialog';
import SupabaseNotice from '../../components/SupabaseNotice';
import { RESOURCE_TYPES } from '../../utils/bookingUtils';

const EMPTY_FORM = {
  resource_name: '',
  resource_type: 'Computer Lab',
  room_number: '',
  capacity: '',
  description: '',
  is_active: true,
};

export default function AdminResourcesPage() {
  const { resources, loading, reload } = useResources({ includeInactive: true });
  const { showSuccess, showError } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  function openAdd() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(resource) {
    setEditTarget(resource);
    setForm({
      resource_name: resource.resource_name,
      resource_type: resource.resource_type,
      room_number: resource.room_number,
      capacity: String(resource.capacity),
      description: resource.description || '',
      is_active: resource.is_active,
    });
    setModalOpen(true);
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.resource_name.trim() || !form.room_number.trim() || !form.capacity) {
      showError('Name, room number, and capacity are required.', 'Validation');
      return;
    }
    if (Number(form.capacity) < 1) {
      showError('Capacity must be at least 1.', 'Validation');
      return;
    }
    setSaving(true);
    try {
      if (editTarget) {
        await updateResource(editTarget.id, { ...form, capacity: Number(form.capacity) });
        showSuccess('Resource updated successfully.', 'Saved');
      } else {
        await createResource({ ...form, capacity: Number(form.capacity) });
        showSuccess('New resource added successfully.', 'Created');
      }
      setModalOpen(false);
      await reload();
    } catch (err) {
      showError(err.message || 'Failed to save resource.', 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(resource) {
    try {
      await toggleResourceStatus(resource.id, !resource.is_active);
      showSuccess(
        `${resource.resource_name} is now ${!resource.is_active ? 'active' : 'inactive'}.`,
        'Status Updated'
      );
      await reload();
    } catch (err) {
      showError(err.message || 'Failed to update status.', 'Error');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteResource(deleteTarget.id);
      showSuccess(`${deleteTarget.resource_name} deleted.`, 'Deleted');
      setDeleteTarget(null);
      await reload();
    } catch (err) {
      showError(err.message || 'Failed to delete resource. It may have active bookings.', 'Error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">Manage Resources</h1>
          <p className="mt-0.5 text-sm text-slate-500">Add, edit, or deactivate campus facilities.</p>
        </div>
        <button type="button" onClick={openAdd} className="btn-navy">
          <Plus className="h-4 w-4" />
          Add Resource
        </button>
      </div>

      <SupabaseNotice compact />

      {loading ? (
        <LoadingSpinner label="Loading resources..." />
      ) : (
        <div className="mt-5 card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  {['Name', 'Type', 'Room', 'Capacity', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resources.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-navy-800">{r.resource_name}</p>
                      <p className="text-xs text-slate-500 line-clamp-1">{r.description}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{r.resource_type}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-700">{r.room_number}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{r.capacity} seats</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge
                        status={r.is_active ? 'available' : 'inactive'}
                        label={r.is_active ? 'Active' : 'Inactive'}
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggle(r)}
                          title={r.is_active ? 'Deactivate' : 'Activate'}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-navy-700"
                        >
                          {r.is_active ? <ToggleRight className="h-4 w-4 text-emerald-600" /> : <ToggleLeft className="h-4 w-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(r)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-royal-50 hover:text-royal-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(r)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {resources.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                      No resources found. Click "Add Resource" to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-navy-800">
                {editTarget ? 'Edit Resource' : 'Add New Resource'}
              </h2>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="label-text" htmlFor="resource_name">Resource Name *</label>
                <input id="resource_name" name="resource_name" type="text" value={form.resource_name} onChange={handleChange} required className="input-field" placeholder="e.g., Programming & Systems Lab" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-text" htmlFor="resource_type">Type *</label>
                  <select id="resource_type" name="resource_type" value={form.resource_type} onChange={handleChange} className="input-field">
                    {RESOURCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-text" htmlFor="room_number">Room Number *</label>
                  <input id="room_number" name="room_number" type="text" value={form.room_number} onChange={handleChange} required className="input-field" placeholder="e.g., LAB101" />
                </div>
              </div>
              <div>
                <label className="label-text" htmlFor="capacity">Capacity (seats) *</label>
                <input id="capacity" name="capacity" type="number" min="1" value={form.capacity} onChange={handleChange} required className="input-field" />
              </div>
              <div>
                <label className="label-text" htmlFor="description">Description</label>
                <textarea id="description" name="description" rows={3} value={form.description} onChange={handleChange} className="input-field resize-none" placeholder="Brief description of the facility..." />
              </div>
              <div className="flex items-center gap-2.5">
                <input id="is_active" name="is_active" type="checkbox" checked={form.is_active} onChange={handleChange} className="h-4 w-4 rounded border-slate-300 text-royal-600 focus:ring-royal-500" />
                <label htmlFor="is_active" className="text-sm font-medium text-slate-700">Active (available for booking)</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} disabled={saving} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-navy flex-1">
                  {saving ? 'Saving...' : editTarget ? 'Save Changes' : 'Add Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Resource"
        message={`Permanently delete "${deleteTarget?.resource_name}" (${deleteTarget?.room_number})? This cannot be undone. Resources with existing bookings cannot be deleted.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardLayout>
  );
}
