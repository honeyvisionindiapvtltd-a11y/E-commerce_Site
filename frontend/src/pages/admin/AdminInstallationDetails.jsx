import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays, MapPin, Phone, Mail, User, Clock3, Wrench, UserCog, MessageSquareText, Navigation } from 'lucide-react';
import { useCommerce } from '../../context/index.js';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const statusConfig = {
  BOOKED: { label: 'Booking Requested', className: 'bg-amber-100 text-amber-800' },
  CONFIRMED: { label: 'Confirmed', className: 'bg-blue-100 text-blue-800' },
  ASSIGNED: { label: 'Agent Assigned', className: 'bg-purple-100 text-purple-800' },
  AGENT_ACCEPTED: { label: 'Agent Accepted', className: 'bg-indigo-100 text-indigo-800' },
  AGENT_DECLINED: { label: 'Agent Declined', className: 'bg-red-100 text-red-800' },
  ON_THE_WAY: { label: 'On The Way', className: 'bg-orange-100 text-orange-800' },
  ARRIVED: { label: 'Agent Arrived', className: 'bg-cyan-100 text-cyan-800' },
  INSTALLATION_IN_PROGRESS: { label: 'In Progress', className: 'bg-lime-100 text-lime-800' },
  INSTALLATION_COMPLETED: { label: 'Completed', className: 'bg-green-100 text-green-800' },
  FAILED: { label: 'Failed', className: 'bg-red-100 text-red-800' },
  CANCELLED: { label: 'Cancelled', className: 'bg-slate-100 text-slate-800' },
};

const formatDate = (dateValue) => {
  if (!dateValue) return 'N/A';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const formatCurrency = (value) => {
  const num = Number(value || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

export default function AdminInstallationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authToken } = useCommerce();
  const [installation, setInstallation] = useState(null);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [statusInput, setStatusInput] = useState('');
  const [agentInput, setAgentInput] = useState('');
  const [noteInput, setNoteInput] = useState('');

  useEffect(() => {
    if (!authToken) return;
    let ignore = false;
    fetch(`${API_BASE}/admin/users?role=delivery_agent`, { headers: { Authorization: `Bearer ${authToken}` } })
      .then(async (response) => {
        if (!response.ok) return null;
        const payload = await response.json();
        return payload.data || payload.users || [];
      })
      .then((nextAgents) => {
        if (!ignore && nextAgents) setAgents(nextAgents);
      })
      .catch(() => {});
    return () => { ignore = true; };
  }, [authToken]);

  useEffect(() => {
    if (!id || !authToken) return;
    let ignore = false;
    fetch(`${API_BASE}/admin/installations/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${authToken}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load installation booking');
        const payload = await response.json();
        return payload.data || payload;
      })
      .then((booking) => {
        if (ignore) return;
        setInstallation(booking);
        setStatusInput(booking.status || '');
        setAgentInput(booking.assignedAgentId || '');
        setNoteInput(booking.adminNotes || '');
      })
      .catch((loadError) => {
        if (!ignore) setError(loadError.message || 'Unable to load booking details');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => { ignore = true; };
  }, [id, authToken]);

  const statusOptions = useMemo(() => [
    'BOOKED',
    'CONFIRMED',
    'ASSIGNED',
    'AGENT_ACCEPTED',
    'AGENT_DECLINED',
    'ON_THE_WAY',
    'ARRIVED',
    'INSTALLATION_IN_PROGRESS',
    'INSTALLATION_COMPLETED',
    'FAILED',
    'CANCELLED',
  ], []);

  const updateStatus = async () => {
    if (!installation || !statusInput || statusInput === installation.status) return;
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/admin/installations/${encodeURIComponent(installation.id || installation._id)}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status: statusInput, note: `Admin updated status to ${statusInput}` }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'Unable to update status');
      }
      setInstallation(payload.data || installation);
    } catch (err) {
      setError(err.message || 'Unable to update status');
    } finally {
      setSaving(false);
    }
  };

  const assignAgent = async () => {
    if (!installation || !agentInput) return;
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/admin/installations/${encodeURIComponent(installation.id || installation._id)}/assign-agent`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ agentId: agentInput }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'Unable to assign agent');
      }
      setInstallation(payload.data || installation);
    } catch (err) {
      setError(err.message || 'Unable to assign agent');
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    if (!installation || !noteInput.trim()) return;
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/admin/installations/${encodeURIComponent(installation.id || installation._id)}/notes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ notes: noteInput }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'Unable to save notes');
      }
      setInstallation(payload.data || installation);
    } catch (err) {
      setError(err.message || 'Unable to save admin notes');
    } finally {
      setSaving(false);
    }
  };

  const collectCodPayment = async () => {
    if (!installation || String(installation.paymentMethod || '').toUpperCase() !== 'COD') return;
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/admin/installations/${encodeURIComponent(installation.id || installation._id)}/payment/collect`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ amount: Number(installation.total) }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to collect COD payment');
      setInstallation(payload.data || installation);
    } catch (err) {
      setError(err.message || 'Unable to collect COD payment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-6xl animate-pulse space-y-4">
          <div className="h-10 w-56 rounded bg-slate-200" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="h-72 rounded-2xl bg-slate-200" />
            <div className="h-72 rounded-2xl bg-slate-200 lg:col-span-2" />
          </div>
        </div>
      </div>
    );
  }

  if (!installation || error) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="text-lg font-semibold">Installation booking unavailable</p>
          <p className="mt-2 text-sm">{error || 'The requested installation could not be loaded.'}</p>
          <button
            onClick={() => navigate('/admin/installations')}
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Back to installations
          </button>
        </div>
      </div>
    );
  }

  const statusClass = statusConfig[installation.status]?.className || 'bg-slate-100 text-slate-800';
  const agent = installation.assignedAgentId || installation.assignedAgent || null;
  const customer = installation.userId || installation.customer || {};
  const location = installation.customer || {};
  const timeline = installation.statusHistory || [];
  const customerName = customer.name || installation.customerName || 'Customer information unavailable';
  const customerPhone = customer.phone || installation.customerPhone || 'N/A';
  const customerEmail = customer.email || installation.customerEmail || 'N/A';

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/admin/installations" className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900">
              <ArrowLeft size={16} /> Back to bookings
            </Link>
          </div>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>
            {statusConfig[installation.status]?.label || installation.status}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Installation booking</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">{installation.id || installation.bookingNumber || installation._id}</h1>
            </div>
            <div className="text-left md:text-right">
              <p className="text-sm text-slate-500">Preferred slot</p>
              <p className="text-base font-semibold text-slate-900">{installation.preferredDate || 'Not set'} {installation.preferredSlot ? `• ${installation.preferredSlot}` : ''}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-2">
                <CalendarDays className="text-slate-500" size={18} />
                <h2 className="text-lg font-semibold text-slate-900">Booking details</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Service</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{installation.service || 'Installation service'}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Created</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{formatDate(installation.createdAt)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Scheduled</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{formatDate(installation.scheduledDate || installation.preferredDate)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Amount</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(installation.total || installation.installationPrice)}</p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-2">
                <User className="text-slate-500" size={18} />
                <h2 className="text-lg font-semibold text-slate-900">Customer information</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                  <User size={18} className="mt-1 text-slate-500" />
                  <div>
                    <p className="text-sm text-slate-500">Customer</p>
                    <p className="text-base font-semibold text-slate-900">{customerName}</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                    <Phone size={18} className="text-slate-500" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Phone</p>
                      <p className="text-sm font-medium text-slate-900">{customerPhone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                    <Mail size={18} className="text-slate-500" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Email</p>
                      <p className="text-sm font-medium text-slate-900">{customerEmail}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="mt-1 text-slate-500" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Service address</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {location.address || 'Address unavailable'}
                        {location.city ? `, ${location.city}` : ''}
                        {location.state ? `, ${location.state}` : ''}
                        {location.pinCode ? ` - ${location.pinCode}` : ''}
                      </p>
                      {location.latitude && location.longitude && (
                        <a
                          href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-blue-600"
                        >
                          <Navigation size={14} /> Open in Maps
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-2">
                <Clock3 className="text-slate-500" size={18} />
                <h2 className="text-lg font-semibold text-slate-900">Status timeline</h2>
              </div>

              <div className="space-y-4">
                {timeline.length > 0 ? timeline.map((item, idx) => (
                  <div key={`${item.status}-${idx}`} className="flex gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusConfig[item.status]?.className || 'bg-slate-100 text-slate-700'}`}>
                          {statusConfig[item.status]?.label || item.status}
                        </span>
                        <span className="text-xs text-slate-500">{formatDate(item.timestamp)}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{item.note || 'Status updated'}</p>
                      <p className="mt-1 text-xs text-slate-500">Updated by: {item.changedByName || 'System'} ({item.changedByRole || 'admin'})</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-slate-500">No timeline entries yet.</p>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <UserCog className="text-slate-500" size={18} />
                <h2 className="text-lg font-semibold text-slate-900">Assignment</h2>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Assigned agent</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">{agent?.name || installation.assignedAgentName || 'Not assigned yet'}</p>
                  {agent?.phone || installation.assignedAgentPhone ? (
                    <p className="mt-1 text-sm text-slate-600">{agent?.phone || installation.assignedAgentPhone}</p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Change status</label>
                  <select
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{statusConfig[status]?.label || status}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={updateStatus}
                    disabled={saving || statusInput === installation.status}
                    className="mt-3 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? 'Updating...' : 'Update status'}
                  </button>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Assign agent</label>
                  <select
                    value={agentInput}
                    onChange={(e) => setAgentInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">Select an agent</option>
                    {agents.map((agentOption) => (
                      <option key={agentOption._id} value={agentOption._id}>
                        {agentOption.name} {agentOption.phone ? `(${agentOption.phone})` : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={assignAgent}
                    disabled={saving || !agentInput}
                    className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Assign agent
                  </button>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <MessageSquareText className="text-slate-500" size={18} />
                <h2 className="text-lg font-semibold text-slate-900">Admin notes</h2>
              </div>

              <textarea
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                rows={5}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 outline-none focus:border-blue-500"
                placeholder="Add internal note for this installation..."
              />
              <button
                type="button"
                onClick={saveNotes}
                disabled={saving || !noteInput.trim()}
                className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Save notes
              </button>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Wrench className="text-slate-500" size={18} />
                <h2 className="text-lg font-semibold text-slate-900">Job summary</h2>
              </div>
              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex items-center justify-between gap-3"><span>Order</span><strong>{installation.orderNumber || installation.orderId || 'Not linked'}</strong></li>
                <li className="flex items-center justify-between gap-3"><span>Customer notes</span><strong>{installation.customerNotes ? 'Added' : 'None'}</strong></li>
                <li className="flex items-center justify-between gap-3"><span>Payment method</span><strong>{String(installation.paymentMethod || 'ONLINE').toUpperCase() === 'COD' ? 'Cash on Delivery' : String(installation.paymentMethod || 'ONLINE').toUpperCase()}</strong></li>
                <li className="flex items-center justify-between gap-3"><span>Payment status</span><strong>{installation.paymentStatus || 'pending'}</strong></li>
                <li className="flex items-center justify-between gap-3"><span>Amount</span><strong>{formatCurrency(installation.total)}</strong></li>
                {installation.paymentStatus !== 'PAID' && String(installation.paymentMethod || '').toUpperCase() === 'COD' && (
                  <li><button type="button" onClick={collectCodPayment} disabled={saving} className="w-full rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-60">Mark COD Payment Collected</button></li>
                )}
                {installation.paidAt && <li className="flex items-center justify-between gap-3"><span>Paid at</span><strong>{formatDate(installation.paidAt)}</strong></li>}
                <li className="flex items-center justify-between gap-3"><span>Completion</span><strong>{installation.completedDate ? formatDate(installation.completedDate) : 'Pending'}</strong></li>
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
