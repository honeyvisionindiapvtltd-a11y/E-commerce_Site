import { useEffect, useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Sparkles, Upload, AlertTriangle, CheckCircle2, LoaderCircle, ArrowRight, ShoppingCart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { useCommerce } from '../context/index.js';
import { cameraAndUpload } from '../services/cameraAndUpload.ts';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const statusLabels = {
  idle: 'Ready to scan',
  validating: 'Validating image...',
  analyzing: 'Analyzing image...',
  matching: 'Finding matching products...',
  checking: 'Checking HoneyVision catalog...',
  complete: 'Search complete',
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
  const [result, setResult] = useState(null);
  const [possibleMatches, setPossibleMatches] = useState([]);
  const [capturing, setCapturing] = useState(false);

  const currentStatusLabel = statusLabels[status] || statusLabels.idle;

  const triggerFilePicker = () => {
    if (!uploading && !capturing) inputRef.current?.click();
  };

  useEffect(() => () => {
    if (selectedPreview) URL.revokeObjectURL(selectedPreview);
  }, [selectedPreview]);

  const toFileFromDataUrl = async (dataUrl, mimeType) => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
    return new File([blob], `scan-product.${extension}`, { type: mimeType });
  };

  const processImageInput = async (imageData, source) => {
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
      file = new File([imageData.data], imageData.fileName || 'scan-product.jpg', { type: imageData.mimeType });
    }

    if (!file) {
      setError('Unable to read the selected image. Please try again.');
      setStatus('error');
      return;
    }

    await handleImageFile(file, source);
  };

  const handleCameraCapture = async () => {
    if (uploading || capturing) return;
    try {
      setCapturing(true);
      const imageData = await cameraAndUpload.takeCameraPhoto({ quality: 90 });
      await processImageInput(imageData, 'camera');
    } catch (cameraError) {
      const message = cameraError?.message || 'Camera is unavailable right now.';
      if (!message.toLowerCase().includes('cancel')) {
        setError(message);
        setStatus('error');
      }
    } finally {
      setCapturing(false);
    }
  };

  const handleGalleryPick = async () => {
    if (uploading || capturing) return;
    try {
      setCapturing(true);
      const imageData = await cameraAndUpload.pickFromGallery({ quality: 90 });
      await processImageInput(imageData, 'upload');
    } catch (galleryError) {
      const message = galleryError?.message || 'Gallery access failed.';
      if (!message.toLowerCase().includes('cancel')) {
        setError(message);
        setStatus('error');
      }
    } finally {
      setCapturing(false);
    }
  };

  const resetState = () => {
    setSelectedPreview('');
    setResult(null);
    setPossibleMatches([]);
    setError('');
    setStatus('idle');
  };

  const handleImageFile = async (file, source = 'upload') => {
    if (!file) return;
    if (uploading) return;

    const supported = ['image/jpeg', 'image/png', 'image/webp'];
    if (!supported.includes(file.type)) {
      setError('Unsupported image type. Use JPG, PNG, or WebP.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image too large. Please upload a file under 10 MB.');
      return;
    }

    setSelectedPreview(URL.createObjectURL(file));
    setError('');
    setResult(null);
    setPossibleMatches([]);
    setUploading(true);
    setStatus('validating');

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('source', source);
      formData.append('device', Capacitor.isNativePlatform() ? 'native' : 'web');

      setStatus('analyzing');
      const response = await fetch(`${API_BASE}/products/search-by-image`, {
        method: 'POST',
        body: formData,
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || `Image search failed (HTTP ${response.status}). Please try again.`);
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

  const handleSubmit = async (event) => {
    const input = event.target;
    const file = input.files?.[0];
    input.value = '';
    if (file) await handleImageFile(file);
  };

  const addDetectedToCart = () => {
    if (!result?.product || !result.product.availability) return;
    addToCart(result.product.id, 1, false, result.product);
    navigate(`/products/${result.product.id}`);
  };

  const isHighConfidence = ['visual-image-match', 'exact-identifier'].includes(result?.matchType);
  const productAvailable = Boolean(result?.product?.availability ?? safeNumber(result?.product?.stock, 0) > 0);
  const availabilityText = productAvailable ? 'In Stock' : 'Out of Stock';

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">HoneyVision</p>
            <h1 className="mt-2 text-3xl font-black text-[#071426]">Scan Product</h1>
          </div>
          <button type="button" onClick={triggerFilePicker} disabled={uploading || capturing} className="inline-flex items-center gap-2 rounded-xl bg-[#071426] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#132b47] disabled:cursor-wait disabled:opacity-60">
            <Upload size={16} /> {capturing ? 'Opening camera...' : uploading ? 'Searching...' : 'Upload Image'}
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
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
              <button type="button" onClick={handleCameraCapture} disabled={uploading || capturing} className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center transition hover:border-amber-400 hover:bg-amber-50 disabled:cursor-wait disabled:opacity-60">
                <Camera className="h-10 w-10 text-amber-600" />
                <span className="mt-4 text-lg font-bold text-[#071426]">{capturing ? 'Opening camera...' : 'Use Camera'}</span>
                <span className="mt-1 text-sm text-slate-500">Capture a product image</span>
              </button>

              <button type="button" onClick={handleGalleryPick} disabled={uploading || capturing} className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center transition hover:border-amber-400 hover:bg-amber-50 disabled:cursor-wait disabled:opacity-60">
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
                <div className="min-w-0 flex-1">
                  <p>{error}</p>
                  <button type="button" onClick={resetState} className="mt-2 font-semibold underline underline-offset-2">Try another image</button>
                </div>
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

            {result?.product && (
              <div className="space-y-5">
                <div className="flex items-center gap-2 text-emerald-700">
                  {isHighConfidence ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                  <span className="text-sm font-bold uppercase tracking-[0.12em]">
                    {isHighConfidence ? 'Product Found' : 'Possible Match'}
                  </span>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  {result.product?.thumbnail ? (
                    <img src={result.product.thumbnail} alt={result.product?.name || 'Matched product'} className="h-52 w-full rounded-xl object-contain bg-white" />
                  ) : (
                    <div className="flex h-52 items-center justify-center rounded-xl bg-white text-sm text-slate-500">Catalog image unavailable</div>
                  )}
                </div>

                <div>
                  <h3 className="text-2xl font-black text-[#071426]">{result.product?.name || 'Possible match'}</h3>
                  <p className="mt-1 text-sm text-slate-500">{result.product?.brand || 'HoneyVision'} • SKU {result.product?.sku || '---'}</p>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Confidence</p>
                    <p className="text-lg font-black text-[#071426]">{Math.round(safeNumber(result.confidence, 0) * 100)}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Availability</p>
                    <p className={`text-lg font-black ${productAvailable ? 'text-emerald-600' : 'text-red-600'}`}>{availabilityText}</p>
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
                    <button
                      type="button"
                      onClick={addDetectedToCart}
                      disabled={!productAvailable}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-bold text-[#071426] transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                    >
                      <ShoppingCart size={16} /> {productAvailable ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {result && !result.product && (
              <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                <AlertTriangle className="h-10 w-10 text-amber-500" />
                <h2 className="mt-4 text-xl font-black text-[#071426]">No confident product match</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">{result.message || 'Try a closer, well-lit photo of the product label or model number.'}</p>
                <button type="button" onClick={resetState} className="mt-5 rounded-xl bg-[#071426] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#132b47]">Scan another product</button>
              </div>
            )}

            {possibleMatches.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">Possible Matches</h4>
                <div className="mt-3 space-y-3">
                  {possibleMatches.map((match) => (
                    <Link key={match.id} to={`/products/${match.id}`} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 transition hover:border-slate-300 hover:bg-white">
                      {match.thumbnail && <img src={match.thumbnail} alt={match.name} className="h-14 w-14 rounded-xl object-contain bg-white" />}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-[#071426]">{match.name}</p>
                        <p className="text-xs text-slate-500">{match.brand} • {money(match.price)}</p>
                      </div>
                      <span className="text-xs font-semibold text-amber-700">{Math.round(safeNumber(match.confidence, 0) * 100)}%</span>
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
