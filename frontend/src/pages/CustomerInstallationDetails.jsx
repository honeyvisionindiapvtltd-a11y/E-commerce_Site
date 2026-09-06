import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, MapPin, Phone, Mail, ShieldCheck, UserRound, Sparkles } from 'lucide-react';
import { useCommerce } from '../context/index.js';

const statusConfig = {
  BOOKED: { label: 'Booking requested', className: 'bg-amber-100 text-amber-800' },
  CONFIRMED: { label: 'Confirmed', className: 'bg-blue-100 text-blue-800' },
  ASSIGNED: { label: 'Agent assigned', className: 'bg-purple-100 text-purple-800' },
  AGENT_ACCEPTED: { label: 'Agent accepted', className: 'bg-indigo-100 text-indigo-800' },
  AGENT_DECLINED: { label: 'Agent declined', className: 'bg-red-100 text-red-800' },
  ON_THE_WAY: { label: 'On the way', className: 'bg-orange-100 text-orange-800' },
  ARRIVED: { label: 'Agent arrived', className: 'bg-cyan-100 text-cyan-800' },
  INSTALLATION_IN_PROGRESS: { label: 'In progress', className: 'bg-lime-100 text-lime-800' },
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

const formatPrice = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

export default function CustomerInstallationDetails() {
  const { id } = useParams();
  const { installationBookings, fetchInstallation } = useCommerce();
  const [remoteBooking, setRemoteBooking] = useState(null);

  const booking = useMemo(
    () => remoteBooking || installationBookings.find((item) => String(item.id || item._id || item.bookingNumber) === String(id)),
    [id, installationBookings, remoteBooking]
  );

  useEffect(() => {
    fetchInstallation(id).then(setRemoteBooking).catch(() => {});
  }, [fetchInstallation, id]);

  if (!booking) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Installation not found</h1>
          <p className="mt-3 text-sm text-slate-600">This booking is not available in your installation history.</p>
          <Link to="/installation/history" className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
            <ArrowLeft size={16} /> Back to history
          </Link>
        </div>
      </main>
    );
  }

  const customer = booking.customer || {};
  const statusClass = statusConfig[booking.status]?.className || 'bg-slate-100 text-slate-800';
  const timeline = booking.statusHistory || [];

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Link to="/installation/history" className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900">
            <ArrowLeft size={16} /> Back to history
          </Link>
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>
            {statusConfig[booking.status]?.label || booking.status}
          </span>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Booking reference</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">{booking.id || booking.bookingNumber}</h1>
            </div>
            <div className="rounded-2xl bg-slate-100 px-4 py-3 text-left md:text-right">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Preferred slot</p>
              <p className="mt-1 text-base font-semibold text-slate-900">{booking.preferredDate || 'Not set'} {booking.preferredSlot ? `• ${booking.preferredSlot}` : ''}</p>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-2">
                <Sparkles className="text-slate-500" size={18} />
                <h2 className="text-lg font-semibold text-slate-900">Installation details</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <InfoCard label="Service" value={booking.service || 'Installation service'} />
                <InfoCard label="Booked on" value={formatDate(booking.createdAt)} />
                <InfoCard label="Assigned agent" value={booking.assignedAgentName || 'Pending assignment'} />
                <InfoCard label="Amount" value={formatPrice(booking.total || booking.installationPrice)} />
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-2">
                <MapPin className="text-slate-500" size={18} />
                <h2 className="text-lg font-semibold text-slate-900">Service address</h2>
              </div>
              <div className="space-y-2 text-sm text-slate-700">
                <p>{customer.address || booking.address || 'Address not provided'}</p>
                <p>{customer.city || booking.city || ''}{customer.city || booking.city ? ', ' : ''}{customer.state || booking.state || ''}{customer.pinCode || booking.pinCode ? ` - ${customer.pinCode || booking.pinCode}` : ''}</p>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-2">
                <ShieldCheck className="text-slate-500" size={18} />
                <h2 className="text-lg font-semibold text-slate-900">Status timeline</h2>
              </div>
              <div className="space-y-4">
                {timeline.length > 0 ? timeline.map((entry, index) => (
                  <div key={`${entry.status}-${index}`} className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">{index + 1}</div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusConfig[entry.status]?.className || 'bg-slate-100 text-slate-700'}`}>
                          {statusConfig[entry.status]?.label || entry.status}
                        </span>
                        <span className="text-xs text-slate-500">{formatDate(entry.timestamp)}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{entry.note || 'Status updated by the team.'}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-slate-500">The booking timeline will appear here after the technician starts processing it.</p>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-2">
                <UserRound className="text-slate-500" size={18} />
                <h2 className="text-lg font-semibold text-slate-900">Customer contact</h2>
              </div>
              <div className="space-y-4">
                <InfoRow icon={UserRound} label="Name" value={customer.name || booking.customerName || 'Customer'} />
                <InfoRow icon={Phone} label="Phone" value={customer.phone || booking.customerPhone || 'N/A'} />
                <InfoRow icon={Mail} label="Email" value={customer.email || booking.customerEmail || 'N/A'} />
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-2">
                <CalendarDays className="text-slate-500" size={18} />
                <h2 className="text-lg font-semibold text-slate-900">Service notes</h2>
              </div>
              <div className="space-y-3 text-sm text-slate-700">
                <p>{booking.customerNotes || booking.notes || 'No additional service notes were added for this booking.'}</p>
                {booking.adminNotes && <p className="rounded-2xl bg-blue-50 p-3 text-blue-800">Admin note: {booking.adminNotes}</p>}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-base font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
      <Icon size={16} className="text-slate-500" />
      <div>
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-800">{value}</p>
      </div>
    </div>
  );
}
