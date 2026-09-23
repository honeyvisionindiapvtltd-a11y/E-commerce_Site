import { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Sparkles, Upload, AlertTriangle, CheckCircle2, LoaderCircle, ArrowRight, ShoppingCart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCommerce } from '../context/index.js';
import { cameraAndUpload } from '../services/cameraAndUpload.ts';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const statusLabels = {
  idle: 'Ready to scan',
  validating: 'Validating image...',
  analyzing: 'Analyzing image...',
  matching: 'Finding matching products...',
  checking: 'Checking HoneyVision catalog...',
  complete: 'Match complete',
  error: 'Unable to process image',
};

const safeNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(safeNumber(value, 0));

export default function ScanProduct() {
  const navigate = useNavigate();
  const { addToCart } = useCommerce();
  const inputRef = useRef(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState(null);
  const [possibleMatches, setPossibleMatches] = useState([]);

  const currentStatusLabel = statusLabels[status] || statusLabels.idle;

  const triggerFilePicker = () => inputRef.current?.click();

  const toFileFromDataUrl = async (dataUrl, mimeType) => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
    return new File([blob], `scan-product-${Date.now()}.${extension}`, { type: mimeType });
  };

  const processImageInput = async (imageData) => {
    const validation = cameraAndUpload.validateImage(imageData, 10);
    if (!validation.valid) {
      setError(validation.error || 'Invalid image file.');
      setStatus('error');
      return;
    }

    let file;
    if (typeof imageData.data === 'string' && imageData.data.startsWith('data:')) {
      file = await toFileFromDataUrl(imageData.data, imageData.mimeType);
    } else if (imageData.data instanceof Blob) {
      file = new File([imageData.data], imageData.fileName || `scan-product-${Date.now()}.jpg`, { type: imageData.mimeType });
    }

    if (!file) {
      setError('Unable to read the selected image. Please try again.');
      setStatus('error');
      return;
    }

    await handleImageFile(file);
  };

  const handleCameraCapture = async () => {
    try {
      const imageData = await cameraAndUpload.takeCameraPhoto({ quality: 90 });
      await processImageInput(imageData);
    } catch (cameraError) {
      const message = cameraError?.message || 'Camera is unavailable right now.';
      if (!message.toLowerCase().includes('cancel')) {
        setError(message);
        setStatus('error');
      }
    }
  };

  const handleGalleryPick = async () => {
    try {
      const imageData = await cameraAndUpload.pickFromGallery({ quality: 90 });
      await processImageInput(imageData);
    } catch (galleryError) {
      const message = galleryError?.message || 'Gallery access failed.';
      if (!message.toLowerCase().includes('cancel')) {
        setError(message);
        setStatus('error');
      }
    }
  };

  const resetState = () => {
    setSelectedPreview('');
    setSelectedFile(null);
    setResult(null);
    setPossibleMatches([]);
    setError('');
    setStatus('idle');
  };

  const handleImageFile = async (file) => {
    if (!file) return;

    const supported = ['image/jpeg', 'image/png', 'image/webp'];
    if (!supported.includes(file.type)) {
      setError('Unsupported image type. Use JPG, PNG, or WebP.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image too large. Please upload a file under 10 MB.');
      return;
    }

    setSelectedFile(file);
    setSelectedPreview(URL.createObjectURL(file));
    setError('');
    setResult(null);
    setPossibleMatches([]);
    setUploading(true);
    setStatus('validating');

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('source', 'upload');
      formData.append('device', 'web');

      setStatus('analyzing');
      const response = await fetch(`${API_BASE}/products/search-by-image`, {
        method: 'POST',
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || 'Image search failed.');
      }

      setStatus('matching');
      setResult(payload);
      setPossibleMatches(Array.isArray(payload?.possibleMatches) ? payload.possibleMatches : []);
      setStatus('complete');
    } catch (requestError) {
      setError(requestError?.message || 'Unable to identify the product. Please try another image.');
      setStatus('error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (event) => {
    const file = event.target.files?.[0];
    if (file) handleImageFile(file);
  };

  const addDetectedToCart = () => {
    if (!result?.product) return;
    addToCart(result.product.id, 1, false, result.product);
    navigate(`/products/${result.product.id}`);
  };

  const isHighConfidence = safeNumber(result?.confidence, 0) >= 0.82;
  const availabilityText = result?.product?.stock > 0 ? 'Available' : 'Out of Stock';

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">HoneyVision</p>
            <h1 className="mt-2 text-3xl font-black text-[#071426]">Scan Product</h1>
          </div>
          <button type="button" onClick={triggerFilePicker} className="inline-flex items-center gap-2 rounded-xl bg-[#071426] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#132b47]">
            <Upload size={16} /> Upload Image
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          className="hidden"
          onChange={handleSubmit}
        />

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                <Sparkles size={13} /> {currentStatusLabel}
              </div>
              {uploading && <LoaderCircle className="h-5 w-5 animate-spin text-amber-600" />}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <button type="button" onClick={handleCameraCapture} className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center transition hover:border-amber-400 hover:bg-amber-50">
                <Camera className="h-10 w-10 text-amber-600" />
                <span className="mt-4 text-lg font-bold text-[#071426]">Use Camera</span>
                <span className="mt-1 text-sm text-slate-500">Capture a product image</span>
              </button>

              <button type="button" onClick={handleGalleryPick} className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center transition hover:border-amber-400 hover:bg-amber-50">
                <ImageIcon className="h-10 w-10 text-amber-600" />
                <span className="mt-4 text-lg font-bold text-[#071426]">Upload Photo</span>
                <span className="mt-1 text-sm text-slate-500">From gallery or desktop</span>
              </button>
            </div>

            {selectedPreview && (
              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <img src={selectedPreview} alt="Selected product preview" className="h-[320px] w-full rounded-xl object-contain bg-white" />
              </div>
            )}

            {error && (
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </section>

          <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            {!result && !error && (
              <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center">
                <Sparkles className="h-12 w-12 text-amber-500" />
                <h2 className="mt-4 text-xl font-black text-[#071426]">Ready for product recognition</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                  Upload a clear photo of a product to match it against the live HoneyVision catalog and verify stock and availability.
                </p>
              </div>
            )}

            {result && (
              <div className="space-y-5">
                <div className="flex items-center gap-2 text-emerald-700">
                  {isHighConfidence ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                  <span className="text-sm font-bold uppercase tracking-[0.12em]">
                    {isHighConfidence ? 'Product Found' : 'Possible Match'}
                  </span>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <img src={result.product?.thumbnail || selectedPreview} alt={result.product?.name || 'Matched product'} className="h-52 w-full rounded-xl object-contain bg-white" />
                </div>

                <div>
                  <h3 className="text-2xl font-black text-[#071426]">{result.product?.name || 'Possible match'}</h3>
                  <p className="mt-1 text-sm text-slate-500">{result.product?.brand || 'HoneyVision'} • SKU {result.product?.sku || '---'}</p>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Confidence</p>
                    <p className="text-lg font-black text-[#071426]">{safeNumber(result.confidence, 0).toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Availability</p>
                    <p className={`text-lg font-black ${result.product?.stock > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{result.product?.stock > 0 ? availabilityText : 'Out of Stock'}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-slate-600">
                  <p><span className="font-semibold text-slate-700">Price:</span> {money(result.product?.price || 0)}</p>
                  {result.product?.mrp > 0 && <p><span className="font-semibold text-slate-700">MRP:</span> <span className="line-through">{money(result.product?.mrp || 0)}</span></p>}
                  <p><span className="font-semibold text-slate-700">Stock:</span> {safeNumber(result.product?.stock, 0)} units</p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link to={result.product ? `/products/${result.product.id}` : '#'} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#071426] hover:bg-slate-50">
                    View Product <ArrowRight size={16} />
                  </Link>
                  {result.product && (
                    <button type="button" onClick={addDetectedToCart} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-bold text-[#071426] hover:bg-amber-300">
                      <ShoppingCart size={16} /> Add to Cart
                    </button>
                  )}
                </div>
              </div>
            )}

            {possibleMatches.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">Possible Matches</h4>
                <div className="mt-3 space-y-3">
                  {possibleMatches.map((match) => (
                    <Link key={match.id} to={`/products/${match.id}`} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 transition hover:border-slate-300 hover:bg-white">
                      <img src={match.thumbnail} alt={match.name} className="h-14 w-14 rounded-xl object-contain bg-white" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-[#071426]">{match.name}</p>
                        <p className="text-xs text-slate-500">{match.brand} • {money(match.price)}</p>
                      </div>
                      <span className="text-xs font-semibold text-amber-700">{safeNumber(match.confidence, 0).toFixed(2)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
