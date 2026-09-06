import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock3, MapPin, Navigation, PackageCheck, Phone, User, XCircle } from 'lucide-react';
import { useCommerce } from '../context/index.js';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const statusConfig = {
  BOOKED: { label: 'Booking Requested', className: 'bg-amber-100 text-amber-800' },
  CONFIRMED: { label: 'Confirmed', className: 'bg-blue-100 text-blue-800' },
  ASSIGNED: { label: 'Assigned', className: 'bg-purple-100 text-purple-800' },
  AGENT_ACCEPTED: { label: 'Accepted', className: 'bg-indigo-100 text-indigo-800' },
  AGENT_DECLINED: { label: 'Declined', className: 'bg-red-100 text-red-800' },
  ON_THE_WAY: { label: 'On The Way', className: 'bg-orange-100 text-orange-800' },
  ARRIVED: { label: 'Arrived', className: 'bg-cyan-100 text-cyan-800' },
  INSTALLATION_IN_PROGRESS: { label: 'In Progress', className: 'bg-lime-100 text-lime-800' },
  INSTALLATION_COMPLETED: { label: 'Completed', className: 'bg-green-100 text-green-800' },
  FAILED: { label: 'Failed', className: 'bg-red-100 text-red-800' },
  CANCELLED: { label: 'Cancelled', className: 'bg-slate-100 text-slate-800' },
};

const formatDate = (value) => {
  if (!value) return 'Not scheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const toJobId = (job) => job?.id || job?._id || job?.bookingNumber || 'unknown';

export default function AgentInstallationDashboard() {
  const { authToken } = useCommerce();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadJobs = async () => {
    if (!authToken) return;

    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_BASE}/agent/installations`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'Unable to load installation jobs');
      }

      const list = Array.isArray(payload) ? payload : payload.data || [];
      setJobs(list);
    } catch (err) {
      setError(err.message || 'Unable to load installation jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [authToken]);

  const quickActions = useMemo(() => ({
    ASSIGNED: ['AGENT_ACCEPTED', 'AGENT_DECLINED'],
    AGENT_ACCEPTED: ['ON_THE_WAY', 'FAILED'],
    ON_THE_WAY: ['ARRIVED', 'FAILED'],
    ARRIVED: ['INSTALLATION_IN_PROGRESS', 'FAILED'],
    INSTALLATION_IN_PROGRESS: ['INSTALLATION_COMPLETED', 'FAILED'],
    FAILED: ['ASSIGNED'],
  }), []);

  const updateJobStatus = async (job, nextStatus, reason = '') => {
    if (!job || !nextStatus) return;

    setUpdating(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${API_BASE}/agent/installations/${encodeURIComponent(toJobId(job))}/update-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          status: nextStatus,
          note: reason || `Status updated to ${nextStatus}`,
          failureReason: nextStatus === 'FAILED' ? reason || 'Customer unavailable' : undefined,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'Unable to update job status');
      }

      await loadJobs();
      setMessage(`Job status updated to ${statusConfig[nextStatus]?.label || nextStatus}`);
    } catch (err) {
      setError(err.message || 'Unable to update job status');
    } finally {
      setUpdating(false);
    }
  };

  const acceptJob = async (job) => {
    setUpdating(true);
    try {
      const response = await fetch(`${API_BASE}/agent/installations/${encodeURIComponent(toJobId(job))}/accept`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'Unable to accept installation');
      }
      await loadJobs();
      setMessage('Installation accepted');
    } catch (err) {
      setError(err.message || 'Unable to accept installation');
    } finally {
      setUpdating(false);
    }
  };

  const declineJob = async (job) => {
    setUpdating(true);
    try {
      const response = await fetch(`${API_BASE}/agent/installations/${encodeURIComponent(toJobId(job))}/decline`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ reason: 'Unable to attend this installation at the scheduled time.' }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'Unable to decline installation');
      }
      await loadJobs();
      setMessage('Installation declined');
    } catch (err) {
      setError(err.message || 'Unable to decline installation');
    } finally {
      setUpdating(false);
    }
  };

  const shareLocation = (job) => {
    if (!navigator.geolocation) {
      setError('This browser does not support geolocation.');
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const response = await fetch(`${API_BASE}/agent/installations/${encodeURIComponent(toJobId(job))}/location`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading || 0,
            speed: position.coords.speed || 0,
          }),
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.message || 'Unable to update live location');
        }

        setMessage('Live location updated successfully');
      } catch (err) {
        setError(err.message || 'Unable to update live location');
      }
    }, () => {
      setError('Location permission is required to share your live route.');
    }, {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 10000,
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">Installation team</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">My installation jobs</h1>
          </div>
          <div className="flex gap-2">
            <Link to="/delivery-agent" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Delivery dashboard</Link>
            <button onClick={loadJobs} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Refresh</button>
          </div>
        </header>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {message && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
            Loading installation jobs...
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            No installation jobs assigned.
          </div>
        ) : (
          <div className="grid gap-5">
            {jobs.map((job) => {
              const jobStatus = job.status || 'BOOKED';
              const allowed = quickActions[jobStatus] || [];
              const customerName = job.customerName || job.customer?.name || 'Customer';
              const customerPhone = job.customerPhone || job.customer?.phone || 'N/A';
              const customerAddress = job.customer?.address || job.address || 'Address not provided';

              return (
                <article key={toJobId(job)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{toJobId(job)}</p>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusConfig[jobStatus]?.className || 'bg-slate-100 text-slate-700'}`}>
                          {statusConfig[jobStatus]?.label || jobStatus}
                        </span>
                      </div>

                      <h2 className="mt-3 text-xl font-bold text-slate-900">{job.service || 'Installation service'}</h2>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {jobStatus === 'ASSIGNED' && (
                        <>
                          <button onClick={() => acceptJob(job)} disabled={updating} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">Accept</button>
                          <button onClick={() => declineJob(job)} disabled={updating} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-60">Decline</button>
                        </>
                      )}

                      {jobStatus !== 'ASSIGNED' && jobStatus !== 'INSTALLATION_COMPLETED' && jobStatus !== 'CANCELLED' && (
                        <button onClick={() => shareLocation(job)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                          <span className="inline-flex items-center gap-2"><Navigation size={15} /> Update location</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Customer</p>
                      <div className="mt-2 flex items-center gap-2 text-slate-800">
                        <User size={15} className="text-slate-500" />
                        <span className="font-medium">{customerName}</span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Phone</p>
                      <div className="mt-2 flex items-center gap-2 text-slate-800">
                        <Phone size={15} className="text-slate-500" />
                        <span className="font-medium">{customerPhone}</span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Schedule</p>
                      <div className="mt-2 flex items-center gap-2 text-slate-800">
                        <Clock3 size={15} className="text-slate-500" />
                        <span className="font-medium">{formatDate(job.preferredDate || job.scheduledDate)}</span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Amount</p>
                      <div className="mt-2 flex items-center gap-2 text-slate-800">
                        <PackageCheck size={15} className="text-slate-500" />
                        <span className="font-medium">₹{Number(job.total || job.installationPrice || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl bg-slate-50 p-4">
                    <div className="flex items-start gap-3">
                      <MapPin size={16} className="mt-0.5 text-slate-500" />
                      <p className="text-sm leading-6 text-slate-700">{customerAddress}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {allowed.length > 0 && allowed.map((status) => (
                      <button
                        key={status}
                        onClick={() => updateJobStatus(job, status, status === 'FAILED' ? 'Customer unavailable' : `Progress update: ${status}`)}
                        disabled={updating}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-60"
                      >
                        {statusConfig[status]?.label || status}
                      </button>
                    ))}

                    {jobStatus === 'INSTALLATION_IN_PROGRESS' && (
                      <button
                        onClick={() => updateJobStatus(job, 'INSTALLATION_COMPLETED', 'Installation completed successfully')}
                        disabled={updating}
                        className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        Mark completed
                      </button>
                    )}

                    {jobStatus === 'AGENT_ACCEPTED' && (
                      <button
                        onClick={() => updateJobStatus(job, 'ON_THE_WAY', 'Heading to customer location')}
                        disabled={updating}
                        className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        Start travel
                      </button>
                    )}
                    {jobStatus === 'ARRIVED' && (
                      <button
                        onClick={() => updateJobStatus(job, 'INSTALLATION_IN_PROGRESS', 'Installation started')}
                        disabled={updating}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        Start installation
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
