import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/useAuth';
import { ChevronDown, Filter, Search, ChevronLeft, ChevronRight, Eye, Edit2, UserPlus, Trash2, AlertCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Status badge component
function StatusBadge({ status }) {
  const statusConfig = {
    BOOKED: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Booking Requested' },
    CONFIRMED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Confirmed' },
    ASSIGNED: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Agent Assigned' },
    AGENT_ACCEPTED: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Agent Accepted' },
    AGENT_DECLINED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Agent Declined' },
    ON_THE_WAY: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'On The Way' },
    ARRIVED: { bg: 'bg-cyan-100', text: 'text-cyan-800', label: 'Agent Arrived' },
    INSTALLATION_IN_PROGRESS: { bg: 'bg-lime-100', text: 'text-lime-800', label: 'In Progress' },
    INSTALLATION_COMPLETED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
    FAILED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Failed' },
    CANCELLED: { bg: 'bg-slate-100', text: 'text-slate-800', label: 'Cancelled' },
  };

  const config = statusConfig[status] || statusConfig.BOOKED;

  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

export default function AdminInstallations() {
  const { authToken, user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [agents, setAgents] = useState([]);
  const [stats, setStats] = useState({});
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [assigningAgent, setAssigningAgent] = useState(false);

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/installations/statistics`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data || {});
      }
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    }
  };

  // Fetch installations
  const fetchInstallations = async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page,
        pageSize,
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter && { status: statusFilter }),
        ...(agentFilter && { agentId: agentFilter }),
        ...(dateFilter && { startDate: dateFilter, endDate: dateFilter }),
      });

      const response = await fetch(`${API_BASE}/admin/installations?${params}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch installations');
      }

      const data = await response.json();
      setBookings(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to load installations');
    } finally {
      setLoading(false);
    }
  };

  // Fetch agents
  const fetchAgents = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/users?role=delivery_agent`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAgents(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch agents:', err);
    }
  };

  useEffect(() => {
    if (!authToken) return;
    fetchStatistics();
    fetchAgents();
  }, [authToken]);

  useEffect(() => {
    if (!authToken) return;
    setPage(0);
    fetchInstallations();
  }, [searchQuery, statusFilter, agentFilter, dateFilter, authToken]);

  useEffect(() => {
    if (!authToken) return;
    fetchInstallations();
  }, [page, pageSize, authToken]);

  const totalPages = Math.ceil(total / pageSize);

  const openAssignModal = (booking) => {
    const bookingId = booking.id || booking._id;
    const customer = booking.userId || booking.customer || {};
    setSelectedBooking({
      ...booking,
      bookingId,
      customerName: customer.name || booking.customerName || 'Customer information unavailable',
    });
    setSelectedAgentId(booking.assignedAgentId?._id || booking.assignedAgentId || '');
    setAssignModalOpen(true);
  };

  const assignAgentToBooking = async () => {
    if (!selectedBooking || !selectedAgentId) return;

    setAssigningAgent(true);
    try {
      const response = await fetch(`${API_BASE}/admin/installations/${encodeURIComponent(selectedBooking.id || selectedBooking._id)}/assign-agent`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ agentId: selectedAgentId }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'Unable to assign agent');
      }

      const assignedAgent = agents.find((agent) => String(agent._id) === String(selectedAgentId));
      setBookings((current) => current.map((booking) => {
        if (String(booking._id) !== String(selectedBooking._id) && (booking.id || booking._id) !== (selectedBooking.id || selectedBooking._id)) {
          return booking;
        }

        const nextBooking = {
          ...booking,
          assignedAgentId: selectedAgentId,
          assignedAgentName: assignedAgent?.name || booking.assignedAgentName || 'Assigned agent',
          assignedAgentPhone: assignedAgent?.phone || booking.assignedAgentPhone || '',
          status: payload.data?.status || 'ASSIGNED',
        };

        return nextBooking;
      }));

      setAssignModalOpen(false);
      setSelectedBooking(null);
      setSelectedAgentId('');
      await fetchStatistics();
      await fetchInstallations();
    } catch (err) {
      setError(err.message || 'Unable to assign agent');
    } finally {
      setAssigningAgent(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900">Installation Bookings</h1>
          <p className="mt-2 text-sm text-slate-600">Manage customer installation bookings and agent assignments</p>
        </div>
      </div>

      {/* Statistics Cards */}
      {Object.keys(stats).length > 0 && (
        <div className="border-b border-slate-200 bg-white px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              {[
                { label: 'Total', value: stats.total || 0 },
                { label: 'Booked', value: stats.BOOKED || 0, status: 'BOOKED' },
                { label: 'Confirmed', value: stats.CONFIRMED || 0, status: 'CONFIRMED' },
                { label: 'Assigned', value: stats.ASSIGNED || 0, status: 'ASSIGNED' },
                { label: 'In Progress', value: stats.INSTALLATION_IN_PROGRESS || 0, status: 'INSTALLATION_IN_PROGRESS' },
                { label: 'Completed', value: stats.INSTALLATION_COMPLETED || 0, status: 'INSTALLATION_COMPLETED' },
              ].map((stat) => (
                <button
                  key={stat.label}
                  onClick={() => {
                    if (stat.status) setStatusFilter(stat.status);
                  }}
                  className="rounded-lg border border-slate-200 bg-white p-4 text-left hover:border-slate-300 transition"
                >
                  <p className="text-xs font-medium text-slate-600">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="border-b border-slate-200 bg-white px-8 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="flex items-center gap-2">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                placeholder="Search by booking ID, customer name, phone, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-300"
              >
                <Filter size={16} /> Filters
              </button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="grid gap-3 md:grid-cols-3">
                {/* Status Filter */}
                <div>
                  <label className="text-xs font-medium text-slate-600">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="BOOKED">Booking Requested</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="ASSIGNED">Agent Assigned</option>
                    <option value="AGENT_ACCEPTED">Agent Accepted</option>
                    <option value="ON_THE_WAY">On The Way</option>
                    <option value="ARRIVED">Agent Arrived</option>
                    <option value="INSTALLATION_IN_PROGRESS">In Progress</option>
                    <option value="INSTALLATION_COMPLETED">Completed</option>
                    <option value="FAILED">Failed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                {/* Agent Filter */}
                <div>
                  <label className="text-xs font-medium text-slate-600">Assigned Agent</label>
                  <select
                    value={agentFilter}
                    onChange={(e) => setAgentFilter(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">All Agents</option>
                    {agents.map((agent) => (
                      <option key={agent._id} value={agent._id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Filter */}
                <div>
                  <label className="text-xs font-medium text-slate-600">Preferred Date</label>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="px-8 py-6">
        <div className="max-w-7xl mx-auto">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 flex items-center gap-2 text-sm text-red-800">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <p className="text-slate-600">Loading installations...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12 rounded-lg border border-slate-200 bg-white">
              <p className="text-slate-600">No installations found</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="w-full">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">Booking ID</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">Service</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">Preferred Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">Agent</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">Amount</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-slate-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {bookings.map((booking) => {
                      const customer = booking.userId || booking.customer || {};
                      const customerName = customer.name || booking.customerName || 'Customer information unavailable';
                      const customerPhone = customer.phone || booking.customerPhone || 'N/A';
                      const agentName = booking.assignedAgentId?.name || booking.assignedAgentName || 'Not assigned';

                      return (
                        <tr key={booking._id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">{booking.id}</td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <p className="font-medium text-slate-900">{customerName}</p>
                              <p className="text-xs text-slate-600">{customerPhone}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700">{booking.service}</td>
                          <td className="px-6 py-4 text-sm text-slate-700">{booking.preferredDate}</td>
                          <td className="px-6 py-4 text-sm">
                            {agentName !== 'Not assigned' ? (
                              <div>
                                <p className="font-medium text-slate-900">{agentName}</p>
                                <p className="text-xs text-slate-600">{booking.assignedAgentPhone || booking.assignedAgentId?.phone || ''}</p>
                              </div>
                            ) : (
                              <span className="text-slate-500">Not assigned</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={booking.status} />
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">
                            ₹{booking.total?.toLocaleString('en-IN') || 0}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center gap-2">
                              <a
                                href={`/admin/installations/${booking.id}`}
                                className="p-1 text-slate-600 hover:text-blue-600 transition"
                                title="View details"
                              >
                                <Eye size={16} />
                              </a>
                              <button
                                type="button"
                                onClick={() => openAssignModal(booking)}
                                className="p-1 text-slate-600 hover:text-amber-600 transition"
                                title="Assign agent"
                              >
                                <Edit2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="space-y-4 lg:hidden">
                {bookings.map((booking) => {
                  const customer = booking.userId || booking.customer || {};
                  const customerName = customer.name || booking.customerName || 'Customer information unavailable';
                  const agentName = booking.assignedAgentId?.name || booking.assignedAgentName || 'Not assigned';

                  return (
                    <div key={booking._id} className="rounded-lg border border-slate-200 bg-white p-4">
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{booking.id}</p>
                          <p className="text-xs text-slate-600">{customerName}</p>
                        </div>
                        <StatusBadge status={booking.status} />
                      </div>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="text-slate-600">Service: </span>
                          <span className="font-medium">{booking.service}</span>
                        </p>
                        <p>
                          <span className="text-slate-600">Date: </span>
                          <span className="font-medium">{booking.preferredDate}</span>
                        </p>
                        {agentName !== 'Not assigned' && (
                          <p>
                            <span className="text-slate-600">Agent: </span>
                            <span className="font-medium">{agentName}</span>
                          </p>
                        )}
                        <p>
                          <span className="text-slate-600">Amount: </span>
                          <span className="font-bold">₹{booking.total?.toLocaleString('en-IN') || 0}</span>
                        </p>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <a
                          href={`/admin/installations/${booking.id}`}
                          className="flex-1 rounded px-3 py-2 text-center text-xs font-medium text-white bg-blue-600 hover:bg-blue-700"
                        >
                          View Details
                        </a>
                        <button
                          type="button"
                          onClick={() => openAssignModal(booking)}
                          className="flex-1 rounded px-3 py-2 text-center text-xs font-medium text-slate-700 bg-amber-50 hover:bg-amber-100"
                        >
                          Assign Agent
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-sm text-slate-600">
                    Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, total)} of {total} bookings
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
                    >
                      <ChevronLeft size={16} /> Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                        const pageNum = i;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg ${
                              page === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'border border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            {pageNum + 1}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                      disabled={page >= totalPages - 1}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
                    >
                      Next <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {assignModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Assign installation agent</p>
                <h3 className="mt-2 text-xl font-bold text-slate-900">{selectedBooking.id}</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAssignModalOpen(false);
                  setSelectedBooking(null);
                  setSelectedAgentId('');
                }}
                className="rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-500 hover:border-slate-300"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Customer</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{selectedBooking.customerName || selectedBooking.userId?.name || 'Customer information unavailable'}</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Current agent</p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {selectedBooking.assignedAgentId?.name || selectedBooking.assignedAgentName || 'Not assigned'}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Select agent</label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">Choose a delivery agent</option>
                  {agents.map((agent) => (
                    <option key={agent._id} value={agent._id}>
                      {agent.name} {agent.phone ? `(${agent.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setAssignModalOpen(false);
                  setSelectedBooking(null);
                  setSelectedAgentId('');
                }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={assignAgentToBooking}
                disabled={!selectedAgentId || assigningAgent}
                className="rounded-lg bg-[#071426] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {assigningAgent ? 'Assigning...' : 'Assign Agent'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
