import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Wallet, Copy, Check, QrCode, PlusCircle, ArrowRight,
  ShieldCheck, Zap, CreditCard, Sparkles, AlertCircle, RefreshCw,
  CheckCircle2, Lock, Smartphone, ExternalLink, ChevronDown, ChevronUp,
  X, FileText, Upload, Image as ImageIcon, Clock
} from 'lucide-react';
import api from '../utils/api';

const AddFund = () => {
  const [walletInfo, setWalletInfo] = useState(null);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [amount, setAmount] = useState('500.00');
  const [amountError, setAmountError] = useState('');
  const [utrNo, setUtrNo] = useState('');
  const [utrError, setUtrError] = useState('');
  const [screenshotBase64, setScreenshotBase64] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [submittingUtr, setSubmittingUtr] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [selectedPaymentApp, setSelectedPaymentApp] = useState('phonepe');
  const [showManualSection, setShowManualSection] = useState(false);
  const [showDirectManualSection, setShowDirectManualSection] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedDialogUtr, setCopiedDialogUtr] = useState(false);
  const navigate = useNavigate();

  const handleCopyDialogUtr = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedDialogUtr(true);
    setTimeout(() => setCopiedDialogUtr(false), 2000);
  };

  // Mode and active UPI determination (Auto mode uses automated gateway API; manual uses static QR/UPI)
  const depositMode = paymentConfig?.deposit_mode || walletInfo?.deposit_mode || 'upi_intent';
  const isAutoMode = depositMode === 'upi_intent' || depositMode === 'auto';
  const autoUpi = paymentConfig?.auto_upi_id || walletInfo?.auto_upi_id || '';
  const manualUpi = paymentConfig?.default_upi_id || walletInfo?.payment_upi_id || walletInfo?.upi_payment_id || '';
  const activeUpiId = isAutoMode ? (autoUpi || '') : (manualUpi || '');
  const payeeName = paymentConfig?.payee_name || 'Pravesh Online';

  // Refs for tracking active order and focusing input fields on error
  const activeOrderRef = useRef(null);
  const launchTimeRef = useRef(null);
  const isVerifyingRef = useRef(false);
  const amountInputRef = useRef(null);
  const utrInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const directUtrInputRef = useRef(null);
  const directFileInputRef = useRef(null);
  const manualUtrInputRef = useRef(null);
  const manualFileInputRef = useRef(null);

  useEffect(() => {
    activeOrderRef.current = activeOrder;
  }, [activeOrder]);

  useEffect(() => {
    isVerifyingRef.current = verifying;
  }, [verifying]);

  const loadData = async () => {
    try {
      const [walletRes, paymentRes] = await Promise.all([
        api.get('/wallet/info'),
        api.get('/payment/config').catch(() => ({ data: { success: '0' } }))
      ]);

      if (walletRes.data?.success === '1') {
        setWalletInfo(walletRes.data.data);
      }
      if (paymentRes.data?.success === '1') {
        setPaymentConfig(paymentRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Quick preset amounts
  const PRESET_AMOUNTS = [300, 500, 1000, 2000, 5000];

  // Validation Helpers
  const getMinMaxAmounts = () => {
    const minAmt = parseFloat(walletInfo?.min_deposite || paymentConfig?.min_deposite || 100);
    const maxAmt = parseFloat(walletInfo?.max_deposite || paymentConfig?.max_deposite || 50000);
    return { minAmt, maxAmt };
  };

  const validateAmount = (val) => {
    const { minAmt, maxAmt } = getMinMaxAmounts();
    if (val === undefined || val === null || String(val).trim() === '') {
      return { isValid: false, msg: 'Deposit amount is required. Please enter an amount.' };
    }
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) {
      return { isValid: false, msg: 'Please enter a valid numeric deposit amount.' };
    }
    if (num < minAmt) {
      return { isValid: false, msg: `Minimum deposit amount is ₹${minAmt.toFixed(2)}. Please enter ₹${minAmt.toFixed(2)} or more.` };
    }
    if (num > maxAmt) {
      return { isValid: false, msg: `Maximum deposit amount is ₹${maxAmt.toFixed(2)}. Please enter ₹${maxAmt.toFixed(2)} or less.` };
    }
    return { isValid: true, msg: '', formatted: num.toFixed(2) };
  };

  const validateUtr = (val) => {
    const clean = String(val || '').replace(/\D/g, '').trim();
    if (!clean) {
      return { isValid: false, msg: 'Please enter the 12-digit UTR reference number.' };
    }
    if (clean.length !== 12) {
      return { isValid: false, msg: `UTR number must be exactly 12 digits (currently ${clean.length} digits).` };
    }
    if (/^(\d)\1{11}$/.test(clean)) {
      return { isValid: false, msg: 'Invalid UTR Number. Dummy or repeated numbers are not accepted.' };
    }
    if (clean === '123456789012' || clean === '012345678901') {
      return { isValid: false, msg: 'Invalid UTR Number. Dummy sequential numbers are not accepted.' };
    }
    return { isValid: true, msg: '', clean };
  };

  const validateFile = (file) => {
    if (!file) return { isValid: true, msg: '' };
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return { isValid: false, msg: 'Invalid file format. Only JPG, PNG, or WEBP images are allowed.' };
    }
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeBytes) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      return { isValid: false, msg: `File size is ${sizeMb}MB. Maximum allowed screenshot size is 5MB.` };
    }
    return { isValid: true, msg: '' };
  };

  const handleSelectPreset = (val) => {
    const formatted = Number(val).toFixed(2);
    setAmount(formatted);
    setAmountError('');
    setError('');
  };

  const handleAmountChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      setAmount('');
      setAmountError('');
      return;
    }
    // Only allow numbers with at most 2 digits after the decimal point
    const regex = /^\d*(\.\d{0,2})?$/;
    if (regex.test(val)) {
      setAmount(val);
      if (amountError) {
        const check = validateAmount(val);
        if (check.isValid) {
          setAmountError('');
        }
      }
    }
  };

  const handleAmountBlur = () => {
    if (!amount || amount.trim() === '') {
      setAmountError('Deposit amount is required. Please enter an amount.');
      return;
    }
    const check = validateAmount(amount);
    if (!check.isValid) {
      setAmountError(check.msg);
    } else {
      setAmount(check.formatted);
      setAmountError('');
    }
  };

  const handleUtrChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 12);
    setUtrNo(val);
    if (val.length === 12) {
      const check = validateUtr(val);
      if (check.isValid) {
        setUtrError('');
      } else {
        setUtrError(check.msg);
      }
    } else if (utrError && val.length < 12) {
      setUtrError('');
    }
  };

  const handleUtrBlur = () => {
    if (!utrNo) return;
    const check = validateUtr(utrNo);
    if (!check.isValid) {
      setUtrError(check.msg);
    } else {
      setUtrError('');
    }
  };

  const compressImage = (file, maxWidth = 1200, quality = 0.75) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const check = validateFile(file);
    if (!check.isValid) {
      setFileError(check.msg);
      setSelectedFile(null);
      setScreenshotBase64('');
      e.target.value = '';
      return;
    }

    setFileError('');
    const sizeStr = file.size > 1024 * 1024
      ? (file.size / (1024 * 1024)).toFixed(1) + ' MB'
      : Math.round(file.size / 1024) + ' KB';

    setSelectedFile({
      name: file.name,
      size: sizeStr
    });

    try {
      const compressed = await compressImage(file);
      setScreenshotBase64(compressed);
    } catch (err) {
      console.warn('Compress failed:', err);
      setFileError('Could not process this image. Please select another image.');
      setSelectedFile(null);
      setScreenshotBase64('');
      e.target.value = '';
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setScreenshotBase64('');
    setFileError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (directFileInputRef.current) directFileInputRef.current.value = '';
    if (manualFileInputRef.current) manualFileInputRef.current.value = '';
  };

  const handleCopyUpi = (upiString) => {
    const textToCopy = upiString || activeOrder?.upi_id || activeUpiId || '';
    if (textToCopy) {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(textToCopy);
        } else {
          const textArea = document.createElement('textarea');
          textArea.value = textToCopy;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
      } catch (err) {
        console.warn('Copy error:', err);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Helper to trigger UPI intent in Android WebView and mobile browsers
  const triggerUpiLaunch = (url) => {
    if (!url) return;
    try {
      window.location.href = url;
    } catch (e) {
      console.warn('Location href failed, trying anchor:', e);
      try {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_self';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (ex) {
        console.warn('Anchor click error:', ex);
      }
    }
  };

  // Realtime Automated Payment Status Polling (Webhook & Gateway Check)
  const callVerifyPayment = async (orderToVerify = null, isManualSubmit = false) => {
    const targetOrder = orderToVerify || activeOrderRef.current;
    if (!targetOrder || isVerifyingRef.current) return;

    setVerifying(true);
    isVerifyingRef.current = true;

    try {
      const res = await api.post('/payment/verify-payment', {
        order_id: targetOrder.order_id,
        payment_id: targetOrder.order_id,
        amount: targetOrder.amount
      });

      if (res.data?.success === '1' && res.data?.approved) {
        // Webhook or Gateway verified & approved payment!
        try {
          sessionStorage.removeItem('pending_upi_order');
        } catch (e) { }

        setActiveOrder(null);
        activeOrderRef.current = null;

        // Update local wallet balance
        if (res.data.wallet !== undefined) {
          setWalletInfo(prev => prev ? { ...prev, wallet: res.data.wallet } : prev);
        } else {
          loadData();
        }

        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

        setPaymentSuccessData({
          amount: targetOrder.amount,
          orderId: targetOrder.order_id,
          wallet: res.data.wallet,
          isManual: false,
          dateFormatted: `${dateStr}, ${timeStr}`,
          msg: res.data.msg || `₹${targetOrder.amount} has been successfully added to your wallet!`
        });
      } else if (isManualSubmit && (res.data?.pending || res.data?.status === '0')) {
        // Manual mode: admin approval pending
        try {
          sessionStorage.removeItem('pending_upi_order');
        } catch (e) { }

        setActiveOrder(null);
        activeOrderRef.current = null;

        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

        setPaymentSuccessData({
          amount: targetOrder.amount,
          orderId: targetOrder.order_id,
          isManual: true,
          dateFormatted: `${dateStr}, ${timeStr}`,
          msg: res.data.msg || 'Deposit request submitted successfully! It is currently PENDING Admin approval.'
        });
      } else if (res.data?.rejected) {
        setError(res.data?.msg || 'Your deposit request was declined.');
      }
      // If still pending in Auto Gateway mode, we keep activeOrder alive so polling continues!
    } catch (err) {
      console.warn('Verify payment poll notice:', err.message);
    } finally {
      setVerifying(false);
      isVerifyingRef.current = false;
    }
  };

  // Auto-polling for Webhook / Gateway Payment Status when activeOrder is active
  useEffect(() => {
    if (!activeOrder) return;

    // Check status immediately
    callVerifyPayment(activeOrder);

    // Poll every 3 seconds for webhook confirmation
    const pollInterval = setInterval(() => {
      callVerifyPayment(activeOrder);
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [activeOrder]);

  // RETURN DETECTION: When user switches back from UPI app to this browser/app
  useEffect(() => {
    const handleReturn = () => {
      if (document.visibilityState === 'visible' && activeOrderRef.current) {
        // User switched back from UPI app: check status immediately!
        callVerifyPayment(activeOrderRef.current);
      }
    };

    const handleFocus = () => {
      if (activeOrderRef.current) {
        callVerifyPayment(activeOrderRef.current);
      }
    };

    document.addEventListener('visibilitychange', handleReturn);
    window.addEventListener('focus', handleFocus);

    // Check for saved pending order on page load (e.g., if mobile browser refreshed in background)
    try {
      const savedPending = sessionStorage.getItem('pending_upi_order');
      if (savedPending) {
        const parsed = JSON.parse(savedPending);
        const elapsed = Date.now() - (parsed.launchTime || 0);
        // If order was created in last 15 minutes, auto resume
        if (elapsed < 15 * 60 * 1000) {
          setActiveOrder(parsed);
          activeOrderRef.current = parsed;
          launchTimeRef.current = parsed.launchTime;
          setShowManualSection(true);
        } else {
          sessionStorage.removeItem('pending_upi_order');
        }
      }
    } catch (e) {
      sessionStorage.removeItem('pending_upi_order');
    }

    return () => {
      document.removeEventListener('visibilitychange', handleReturn);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Primary Action: PROCEED TO PAY / Create Order (Called from initial amount screen)
  const handlePayNow = async () => {
    setError('');
    setMsg('');
    setAmountError('');

    const check = validateAmount(amount);
    if (!check.isValid) {
      setAmountError(check.msg);
      if (amountInputRef.current) {
        amountInputRef.current.focus();
        amountInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    const amt = parseFloat(check.formatted);
    setProcessingPayment(true);

    try {
      const payload = {
        amount: amt,
        app_code: 'upi',
        gateway: paymentConfig?.active_gateway?.gateway_code || 'niceupi',
        ...(!isAutoMode && activeUpiId ? { upi_id: activeUpiId } : {})
      };

      const res = await api.post('/payment/create-order', payload);
      if (res.data.success !== '1') {
        const errorMsg = res.data.msg || 'Failed to initiate UPI payment';
        if (errorMsg.toLowerCase().includes('amount') || errorMsg.toLowerCase().includes('deposit')) {
          setAmountError(errorMsg);
        } else {
          setError(errorMsg);
        }
        setProcessingPayment(false);
        return;
      }

      const orderData = res.data.data;
      const now = Date.now();
      launchTimeRef.current = now;
      activeOrderRef.current = orderData;
      setActiveOrder(orderData);
      setShowManualSection(true);

      // Save to sessionStorage for background tab survival
      try {
        sessionStorage.setItem('pending_upi_order', JSON.stringify({
          ...orderData,
          launchTime: now
        }));
      } catch (e) { }

      // DO NOT auto-redirect: let user select which app to pay from the generated order screen
    } catch (err) {
      console.error(err);
      const serverMsg = err.response?.data?.msg || err.response?.data?.error;
      setError(serverMsg || 'Error launching UPI payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Manual fallback: Submit UTR in case auto verification needs manual reference
  const handleSubmitUtr = async (e, fromScreen = 'active') => {
    e.preventDefault();
    setUtrError('');
    setFileError('');
    setError('');
    setMsg('');

    // 1. Validate UTR Reference Number
    const utrCheck = validateUtr(utrNo);
    if (!utrCheck.isValid) {
      setUtrError(utrCheck.msg);
      if (fromScreen === 'manual' && manualUtrInputRef.current) {
        manualUtrInputRef.current.focus();
      } else if (fromScreen === 'direct' && directUtrInputRef.current) {
        directUtrInputRef.current.focus();
      } else if (utrInputRef.current) {
        utrInputRef.current.focus();
      }
      if (fromScreen === 'active') setShowManualSection(true);
      return;
    }

    // 2. Validate Target Deposit Amount
    const targetAmt = activeOrder?.amount || amount;
    const amtCheck = validateAmount(targetAmt);
    if (!amtCheck.isValid) {
      setAmountError(amtCheck.msg);
      if (amountInputRef.current) {
        amountInputRef.current.focus();
        amountInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSubmittingUtr(true);
    try {
      const res = await api.post('/payment/submit-fund', {
        amount: parseFloat(amtCheck.formatted),
        utr_no: utrCheck.clean,
        order_id: activeOrder?.order_id || '',
        image: screenshotBase64,
        upi_app: fromScreen === 'manual' ? 'Manual QR' : 'UPI App'
      });

      if (res.data.success === '1') {
        try {
          sessionStorage.removeItem('pending_upi_order');
        } catch (e) { }

        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

        setPaymentSuccessData({
          amount: parseFloat(amtCheck.formatted),
          utr: utrCheck.clean,
          orderId: activeOrder?.order_id || 'MANUAL_UPI',
          isManual: true,
          dateFormatted: `${dateStr}, ${timeStr}`,
          msg: res.data.msg || 'Deposit request submitted successfully! Admin will verify and credit your wallet shortly.'
        });
        setAmount('');
        setUtrNo('');
        setSelectedFile(null);
        setScreenshotBase64('');
        setUtrError('');
        setFileError('');
        setAmountError('');
        setActiveOrder(null);
        activeOrderRef.current = null;
      } else {
        if (fromScreen === 'active') setShowManualSection(true);
        if (fromScreen === 'direct') setShowDirectManualSection(true);
        let friendlyMsg = res.data.msg || 'Invalid UTR reference number. Please check and re-enter.';
        if (typeof friendlyMsg === 'string' && /column|sql|table|out of range|row \d|syntax|query|database|foreign key/i.test(friendlyMsg)) {
          friendlyMsg = 'Unable to process deposit request right now. Please check your 12-digit UTR reference number or contact Support.';
        }
        setUtrError(friendlyMsg);
      }
    } catch (err) {
      console.error('Submit fund error:', err);
      if (fromScreen === 'active') setShowManualSection(true);
      if (fromScreen === 'direct') setShowDirectManualSection(true);

      let userFriendlyMsg = 'Unable to submit deposit request right now. Please check your 12-digit UTR reference number or contact Support.';
      const rawError = err.response?.data?.msg || err.response?.data?.error || err.message;
      if (rawError && typeof rawError === 'string') {
        const isDbError = /column|sql|table|out of range|row \d|syntax|query|database|foreign key/i.test(rawError);
        if (!isDbError && rawError.length < 150) {
          userFriendlyMsg = rawError;
        }
      }
      setUtrError(userFriendlyMsg);
    } finally {
      setSubmittingUtr(false);
    }
  };

  const showUpiSetting = paymentConfig ? (paymentConfig.show_upi === 1 || paymentConfig.show_upi === '1' || paymentConfig.show_upi === true) : true;
  const showQrSetting = paymentConfig ? (paymentConfig.show_qr === 1 || paymentConfig.show_qr === '1' || paymentConfig.show_qr === true) : true;

  const numAmt = amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 ? parseFloat(amount) : 0;
  const formattedAmt = numAmt > 0 ? numAmt.toFixed(2) : '';
  const amtQuery = formattedAmt ? `&am=${formattedAmt}` : '';

  const targetQrUpiId = activeOrder?.upi_id || activeUpiId;
  const currentQrUpiUrl = activeOrder?.bhim_url || activeOrder?.generic_upi_url || activeOrder?.upi_url || (targetQrUpiId ? `upi://pay?pa=${encodeURIComponent(targetQrUpiId)}&pn=${encodeURIComponent(payeeName)}${amtQuery}&cu=INR` : '');
  const dynamicQrCodeSrc = currentQrUpiUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(currentQrUpiUrl)}` : '';

  const manualBarcodeImage = paymentConfig?.payment_barcode_image || walletInfo?.payment_barcode_image || '';
  const manualQrImageSrc = manualBarcodeImage
    ? (manualBarcodeImage.startsWith('http') || manualBarcodeImage.startsWith('data:')
      ? manualBarcodeImage
      : `/uploads/${manualBarcodeImage}`)
    : dynamicQrCodeSrc;

  // In Auto mode: ALWAYS show dynamic QR generated from Auto UPI ID with live amount!
  // In Manual mode: show uploaded barcode image or fallback
  const qrImageSrc = isAutoMode ? (dynamicQrCodeSrc || manualQrImageSrc) : (manualQrImageSrc || dynamicQrCodeSrc);

  if (loading) {
    return (
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '60px 20px', textAlign: 'center', color: '#0f172a' }}>
        <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 16px', color: '#043490' }} />
        <p style={{ fontWeight: '700' }}>Loading Deposit Information...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '20px 16px 36px', minHeight: '80vh' }}>

      {/* Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        background: 'linear-gradient(135deg, #043490 0%, #002663 100%)',
        padding: '14px 18px',
        borderRadius: '16px',
        marginBottom: '20px',
        color: '#ffffff',
        boxShadow: '0 4px 14px rgba(4, 52, 144, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: '#ffffff', flexShrink: 0 }}>
            <ArrowLeft size={20} />
          </Link>
          <span style={{
            fontWeight: '800',
            fontSize: '0.98rem',
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            Add Fund (Instant UPI)
          </span>
        </div>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: '800',
          fontSize: '0.9rem',
          background: 'rgba(255, 255, 255, 0.18)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          padding: '6px 12px',
          borderRadius: '20px',
          whiteSpace: 'nowrap',
          color: '#ffffff',
          flexShrink: 0
        }}>
          <Wallet size={16} style={{ flexShrink: 0 }} />
          <span>₹{walletInfo?.wallet || '0'}</span>
        </div>
      </div>

      {/* Global Status Alerts */}
      {msg && (
        <div className="badge badge-success" style={{ display: 'block', padding: '12px', marginBottom: '18px', textAlign: 'center', borderRadius: '10px' }}>
          ✓ {msg}
        </div>
      )}
      {error && (
        <div className="badge badge-danger" style={{ display: 'block', padding: '12px', marginBottom: '18px', textAlign: 'center', borderRadius: '10px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUCCESS / DEPOSIT SUBMITTED MODAL DIALOG                                 */}
      {/* ========================================================================= */}
      {paymentSuccessData && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100000,
            backgroundColor: 'rgba(4, 10, 20, 0.82)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'afDialogFadeIn 0.25s ease-out'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setPaymentSuccessData(null);
              loadData();
            }
          }}
        >
          <style>{`
            @keyframes afDialogFadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes afDialogPopIn {
              from { 
                opacity: 0; 
                transform: scale(0.9) translateY(14px); 
              }
              to { 
                opacity: 1; 
                transform: scale(1) translateY(0); 
              }
            }
            @keyframes afPulseRing {
              0% {
                transform: scale(0.85);
                opacity: 0.9;
              }
              50% {
                transform: scale(1.18);
                opacity: 0.25;
              }
              100% {
                transform: scale(0.85);
                opacity: 0.9;
              }
            }
            @keyframes afDotPulse {
              0%, 100% {
                opacity: 1;
                transform: scale(1);
              }
              50% {
                opacity: 0.35;
                transform: scale(0.75);
              }
            }
          `}</style>

          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '430px',
              backgroundColor: '#0d1a2d',
              backgroundImage: 'linear-gradient(180deg, #11233d 0%, #0a1526 100%)',
              borderRadius: '24px',
              border: '1px solid rgba(214, 190, 102, 0.28)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75), 0 0 35px rgba(16, 185, 129, 0.18)',
              padding: '28px 22px 24px',
              textAlign: 'center',
              color: '#ffffff',
              overflow: 'hidden',
              animation: 'afDialogPopIn 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Top radiant glow */}
            <div style={{
              position: 'absolute',
              top: '-50px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '260px',
              height: '130px',
              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, rgba(214, 190, 102, 0.15) 50%, transparent 80%)',
              filter: 'blur(25px)',
              pointerEvents: 'none'
            }} />

            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setPaymentSuccessData(null);
                loadData();
              }}
              aria-label="Close dialog"
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                zIndex: 2,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
              }}
            >
              <X size={16} />
            </button>

            {/* Animated Icon Badge */}
            <div style={{ position: 'relative', width: '74px', height: '74px', margin: '0 auto 16px' }}>
              {/* Outer pulsing ring */}
              <div style={{
                position: 'absolute',
                inset: '-6px',
                borderRadius: '50%',
                border: '2px solid rgba(16, 185, 129, 0.4)',
                animation: 'afPulseRing 2.4s infinite ease-in-out'
              }} />

              {/* Main Badge */}
              <div style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid rgba(255, 255, 255, 0.25)',
                position: 'relative',
                zIndex: 1
              }}>
                <CheckCircle2 size={40} color="#ffffff" strokeWidth={2.6} />
              </div>
            </div>

            {/* Title & Status */}
            {paymentSuccessData.isManual || paymentSuccessData.utr ? (
              <>
                <h3 style={{
                  fontSize: '1.38rem',
                  fontWeight: '800',
                  margin: '0 0 6px 0',
                  color: '#ffffff',
                  letterSpacing: '0.01em'
                }}>
                  Deposit Request Submitted!
                </h3>
                <p style={{
                  margin: '0 0 14px 0',
                  fontSize: '0.88rem',
                  color: 'rgba(255, 255, 255, 0.75)',
                  lineHeight: 1.45
                }}>
                  Your deposit receipt has been submitted and is pending admin verification.
                </p>

                {/* Status Indicator Pill */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  background: 'rgba(245, 158, 11, 0.14)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  color: '#fbbf24',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  marginBottom: '18px'
                }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#fbbf24',
                    boxShadow: '0 0 8px #fbbf24',
                    display: 'inline-block',
                    animation: 'afDotPulse 1.5s infinite ease-in-out'
                  }} />
                  <Clock size={13} />
                  <span>Pending Admin Approval</span>
                </div>
              </>
            ) : (
              <>
                <h3 style={{
                  fontSize: '1.42rem',
                  fontWeight: '800',
                  margin: '0 0 6px 0',
                  color: '#ffffff',
                  letterSpacing: '0.01em'
                }}>
                  Deposit Request send!
                </h3>

                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(254, 0, 0, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: '#fffb00ff',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  marginBottom: '18px'
                }}>
                  <ShieldCheck size={14} />
                  <span>Pending</span>
                </div>
              </>
            )}

            {/* Receipt Summary Card */}
            <div style={{
              backgroundColor: 'rgba(11, 23, 42, 0.65)',
              border: '1px solid rgba(214, 190, 102, 0.18)',
              borderRadius: '16px',
              padding: '16px 18px',
              marginBottom: '16px',
              textAlign: 'left'
            }}>
              {/* Amount Display */}
              <div style={{ textAlign: 'center', paddingBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'rgba(255, 255, 255, 0.55)',
                  marginBottom: '2px'
                }}>
                  Deposit Amount
                </div>
                <div style={{
                  fontSize: '1.75rem',
                  fontWeight: '900',
                  color: '#043490',
                  letterSpacing: '0.01em',
                  lineHeight: 1.2
                }}>
                  ₹{Number(paymentSuccessData.amount).toFixed(2)}
                </div>
              </div>

              {/* Transaction Meta Rows */}
              <div style={{ paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '9px' }}>
                {paymentSuccessData.utr && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                    <span style={{ color: 'rgba(255, 255, 255, 0.65)', fontWeight: '500' }}>UTR / Reference:</span>
                    <button
                      type="button"
                      onClick={() => handleCopyDialogUtr(paymentSuccessData.utr)}
                      title="Click to copy UTR"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: copiedDialogUtr ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.08)',
                        border: copiedDialogUtr ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.14)',
                        color: copiedDialogUtr ? '#34d399' : '#ffffff',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontFamily: 'monospace',
                        fontWeight: '700',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>{paymentSuccessData.utr}</span>
                      {copiedDialogUtr ? <Check size={12} color="#34d399" /> : <Copy size={12} style={{ opacity: 0.7 }} />}
                    </button>
                  </div>
                )}

                {paymentSuccessData.orderId && paymentSuccessData.orderId !== 'MANUAL_UPI' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                    <span style={{ color: 'rgba(255, 255, 255, 0.65)', fontWeight: '500' }}>Order ID:</span>
                    <span style={{ fontFamily: 'monospace', color: '#ffffff', fontWeight: '600' }}>
                      {paymentSuccessData.orderId}
                    </span>
                  </div>
                )}

                {paymentSuccessData.wallet !== undefined && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                    <span style={{ color: 'rgba(255, 255, 255, 0.65)', fontWeight: '500' }}>Updated Wallet:</span>
                    <span style={{ color: '#34d399', fontWeight: '800' }}>
                      ₹{Number(paymentSuccessData.wallet).toFixed(2)}
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                  <span style={{ color: 'rgba(255, 255, 255, 0.65)', fontWeight: '500' }}>Submission Time:</span>
                  <span style={{ color: 'rgba(255, 255, 255, 0.85)', fontWeight: '600', fontSize: '0.8rem' }}>
                    {paymentSuccessData.dateFormatted || 'Just now'}
                  </span>
                </div>
              </div>
            </div>

            {/* Note / Helper banner */}
            {(paymentSuccessData.isManual || paymentSuccessData.utr) && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px dashed rgba(16, 185, 129, 0.28)',
                borderRadius: '12px',
                padding: '10px 12px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                textAlign: 'left'
              }}>
                <ShieldCheck size={18} color="#10b981" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.82)', lineHeight: 1.4 }}>
                  Admin will verify your payment and credit your balance within <strong>5 to 15 minutes</strong>.
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Primary Action Button */}
              <button
                type="button"
                onClick={() => navigate('/deposit-request-status')}
                style={{
                  width: '100%',
                  padding: '13px 20px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #053FA8 0%, #03256C 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: '800',
                  fontSize: '0.94rem',
                  letterSpacing: '0.02em',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(4, 52, 144, 0.35)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(4, 52, 144, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(4, 52, 144, 0.35)';
                }}
              >
                <span>Track Deposit Status</span>
                <ArrowRight size={17} />
              </button>

              {/* Secondary Buttons Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  style={{
                    padding: '11px 14px',
                    borderRadius: '12px',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    fontWeight: '700',
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e2e8f0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f1f5f9';
                  }}
                >
                  Go to Home
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentSuccessData(null);
                    loadData();
                  }}
                  style={{
                    padding: '11px 14px',
                    borderRadius: '12px',
                    background: '#ffffff',
                    border: '1px dashed #043490',
                    color: '#043490',
                    fontWeight: '700',
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(214, 190, 102, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  + Add More Fund
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 1: ACTIVE ORDER / AWAITING RETURN FROM MOBILE UPI APP              */}
      {/* ========================================================================= */}
      {activeOrder ? (
        <div className="card-glass-v2" style={{ padding: '24px', animation: 'fadeIn 0.2s ease-out', marginBottom: '22px' }}>

          {/* ORDER SUMMARY HEADER */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1.5px solid rgba(16, 185, 129, 0.4)',
              color: '#059669',
              padding: '5px 14px',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: '800',
              marginBottom: '10px',
              letterSpacing: '0.04em'
            }}>
              <CheckCircle2 size={15} color="#10b981" />
              <span>PAYMENT ORDER CREATED</span>
            </div>

            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.65rem', fontWeight: '900', color: '#0f172a' }}>
              Pay ₹{Number(activeOrder.amount).toFixed(2)}
            </h3>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '0.8rem',
              color: '#64748b',
              fontWeight: '600'
            }}>
              <span>Order ID: <strong style={{ color: '#043490' }}>{activeOrder.order_id}</strong></span>
              {activeOrder.gateway_name && (
                <>
                  <span>•</span>
                  <span>Gateway: <strong>{activeOrder.gateway_name}</strong></span>
                </>
              )}
            </div>
          </div>

          {/* STEP 1: PAYMENT BUTTONS ACCORDING TO RESPONSE */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '18px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.04)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <span style={{ fontSize: '0.88rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={16} color="#043490" />
                <span>STEP 1: Tap to Pay with Your UPI App</span>
              </span>
              <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '8px' }}>
                ⚡ 1-Click Launch
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* 1. PhonePe Button (if available) */}
              {(activeOrder.phonepe_url || activeOrder.phonepe_link || activeOrder.bhim_url || activeOrder.generic_upi_url) && (
                <button
                  type="button"
                  onClick={() => triggerUpiLaunch(activeOrder.phonepe_url || activeOrder.phonepe_link || (activeOrder.bhim_url ? activeOrder.bhim_url.replace(/^upi:\/\/pay\?/, 'phonepe://pay?') : activeOrder.generic_upi_url))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '13px 16px',
                    borderRadius: '13px',
                    background: 'linear-gradient(135deg, #5f259f 0%, #441179 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: '800',
                    fontSize: '0.96rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(95, 37, 159, 0.35)',
                    transition: 'transform 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <svg width="22" height="22" viewBox="0 0 36 36" fill="none">
                      <path d="M19.5 9v3.5h3.8c1.8 0 3.2 1.4 3.2 3.2v0.5c0 1.8-1.4 3.2-3.2 3.2H20.8l-5.6 9.6H11l4.8-8.2c-2.3-.4-4-2.4-4-4.8 0-2.7 2.2-4.9 4.9-4.9H19.5V9h-3V7h7v2h-4zm-3 5.5c-1.6 0-2.9 1.3-2.9 2.9 0 1.6 1.3 2.9 2.9 2.9h6.8c.6 0 1.1-.5 1.1-1.1v-.5c0-.6-.5-1.1-1.1-1.1H16.5v-3.1z" fill="#ffffff"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontWeight: '800', fontSize: '0.96rem' }}>Pay with PhonePe</div>
                    <div style={{ fontSize: '0.73rem', opacity: 0.9 }}>1-Click Instant App Transfer</div>
                  </div>
                  <ExternalLink size={18} />
                </button>
              )}

              {/* 2. Paytm Button (if available) */}
              {(activeOrder.paytm_url || activeOrder.paytm_link) && (
                <button
                  type="button"
                  onClick={() => triggerUpiLaunch(activeOrder.paytm_url || activeOrder.paytm_link)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '13px 16px',
                    borderRadius: '13px',
                    background: 'linear-gradient(135deg, #002e6e 0%, #001f4d 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: '800',
                    fontSize: '0.96rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(0, 46, 110, 0.35)',
                    transition: 'transform 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '900',
                    color: '#00b9f1',
                    fontSize: '0.78rem',
                    letterSpacing: '-0.5px',
                    flexShrink: 0
                  }}>
                    Paytm
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontWeight: '800', fontSize: '0.96rem' }}>Pay with Paytm</div>
                    <div style={{ fontSize: '0.73rem', opacity: 0.9 }}>Paytm UPI & Wallet</div>
                  </div>
                  <ExternalLink size={18} />
                </button>
              )}

              {/* 3. Google Pay Button (if available) */}
              {(activeOrder.gpay_url || activeOrder.bhim_url || activeOrder.generic_upi_url) && (
                <button
                  type="button"
                  onClick={() => triggerUpiLaunch(activeOrder.gpay_url || (activeOrder.bhim_url ? activeOrder.bhim_url.replace(/^upi:\/\/pay\?/, 'tez://upi/pay?') : activeOrder.generic_upi_url))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '13px 16px',
                    borderRadius: '13px',
                    background: 'linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: '800',
                    fontSize: '0.96rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(26, 115, 232, 0.35)',
                    transition: 'transform 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <svg width="20" height="20" viewBox="0 0 36 36" fill="none">
                      <path d="M26.4 18.2c0-.6-.1-1.2-.2-1.8H18v3.4h4.7c-.2 1.1-.9 2.1-1.8 2.8v2.3h2.9c1.7-1.6 2.6-3.9 2.6-6.7z" fill="#4285F4"/>
                      <path d="M18 26.8c2.4 0 4.4-.8 5.8-2.1l-2.9-2.3c-.8.5-1.8.8-2.9.8-2.3 0-4.2-1.5-4.9-3.6H10.1v2.3c1.5 3 4.5 4.9 7.9 4.9z" fill="#34A853"/>
                      <path d="M13.1 19.6c-.2-.5-.3-1.1-.3-1.6 0-.6.1-1.1.3-1.6V14.1H10.1C9.5 15.3 9.1 16.6 9.1 18s.4 2.7 1 3.9l3-2.3z" fill="#FBBC05"/>
                      <path d="M18 12.4c1.3 0 2.5.4 3.4 1.3l2.6-2.6C22.4 9.6 20.4 9 18 9c-3.4 0-6.4 1.9-7.9 4.9l3 2.3c.7-2.1 2.6-3.8 4.9-3.8z" fill="#EA4335"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontWeight: '800', fontSize: '0.96rem' }}>Pay with Google Pay</div>
                    <div style={{ fontSize: '0.73rem', opacity: 0.9 }}>GPay 1-Click Fast Pay</div>
                  </div>
                  <ExternalLink size={18} />
                </button>
              )}

              {/* 4. Other UPI (BHIM, CRED, Any UPI App) */}
              {(activeOrder.bhim_url || activeOrder.generic_upi_url || activeOrder.upi_url) && (
                <button
                  type="button"
                  onClick={() => triggerUpiLaunch(activeOrder.bhim_url || activeOrder.generic_upi_url || activeOrder.upi_url)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '13px 16px',
                    borderRadius: '13px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: '800',
                    fontSize: '0.96rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                    transition: 'transform 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <QrCode size={20} />
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontWeight: '800', fontSize: '0.96rem' }}>Pay with Any Other UPI App</div>
                    <div style={{ fontSize: '0.73rem', opacity: 0.9 }}>BHIM, CRED, Navi & All Installed Apps</div>
                  </div>
                  <ExternalLink size={18} />
                </button>
              )}

              {/* 5. Hosted Gateway Payment Page (if payment_url is provided) */}
              {activeOrder.payment_url && (activeOrder.payment_url.startsWith('http://') || activeOrder.payment_url.startsWith('https://')) && (
                <button
                  type="button"
                  onClick={() => window.location.href = activeOrder.payment_url}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '13px 16px',
                    borderRadius: '13px',
                    background: 'linear-gradient(135deg, #043490 0%, #1e40af 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: '800',
                    fontSize: '0.96rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(4, 52, 144, 0.35)',
                    transition: 'transform 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <ExternalLink size={20} />
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontWeight: '800', fontSize: '0.96rem' }}>Open Gateway Payment Page</div>
                    <div style={{ fontSize: '0.73rem', opacity: 0.9 }}>Cards / NetBanking / Dynamic Gateway Page</div>
                  </div>
                  <ArrowRight size={18} />
                </button>
              )}
            </div>
          </div>

          {/* REALTIME AUTOMATED WEBHOOK STATUS CHECK (AUTO-APPROVE) */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '16px',
            padding: '20px 16px',
            marginBottom: '16px',
            textAlign: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.04)'
          }}>
            {/* Live Status Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '20px',
              backgroundColor: verifying ? 'rgba(4, 52, 144, 0.08)' : 'rgba(245, 158, 11, 0.12)',
              border: verifying ? '1px solid rgba(4, 52, 144, 0.25)' : '1px solid rgba(245, 158, 11, 0.35)',
              marginBottom: '12px'
            }}>
              {verifying ? (
                <>
                  <RefreshCw size={14} className="animate-spin" color="#043490" />
                  <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#043490' }}>
                    CHECKING PAYMENT WITH GATEWAY...
                  </span>
                </>
              ) : (
                <>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#f59e0b',
                    display: 'inline-block',
                    boxShadow: '0 0 8px #f59e0b',
                    animation: 'pulse 1.5s infinite'
                  }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#b45309' }}>
                    STATUS: PENDING CONFIRMATION
                  </span>
                </>
              )}
            </div>

            <h4 style={{ margin: '0 0 6px 0', fontSize: '1.08rem', fontWeight: '900', color: '#0f172a' }}>
              Waiting for Payment from UPI App...
            </h4>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>
              Upar diye gaye kisi bhi App (PhonePe, Paytm, GPay) par click karke payment transfer karein. Webhook se verify hote hi wallet me <strong>Instant Auto Credit</strong> ho jayega.
            </p>

            {/* Check Status Button & Cancel Button */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                disabled={verifying}
                onClick={() => callVerifyPayment()}
                className="btn-gold"
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: '12px',
                  fontSize: '0.96rem',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: verifying ? 'not-allowed' : 'pointer'
                }}
              >
                {verifying ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>CHECKING STATUS...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    <span>CHECK PAYMENT STATUS NOW</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  try {
                    sessionStorage.removeItem('pending_upi_order');
                  } catch (e) { }
                  setActiveOrder(null);
                  activeOrderRef.current = null;
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #cbd5e1',
                  color: '#64748b',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                Cancel / Change Amount
              </button>
            </div>
          </div>

          {/* OPTIONAL: SCAN DYNAMIC QR CODE TOGGLE */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
            <button
              type="button"
              onClick={() => setShowManualSection(!showManualSection)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '6px 0'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <QrCode size={16} color="#043490" />
                <span>Or Scan Dynamic QR Code on Another Phone</span>
              </span>
              {showManualSection ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showManualSection && (
              <div style={{ marginTop: '14px', animation: 'fadeIn 0.2s ease-out' }}>
                <div style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '16px',
                  textAlign: 'center'
                }}>
                  {qrImageSrc && (
                    <>
                      <span style={{ fontSize: '0.78rem', color: '#475569', display: 'block', marginBottom: '8px', fontWeight: '800' }}>
                        SCAN WITH ANY UPI APP TO PAY ₹{Number(activeOrder.amount).toFixed(2)}
                      </span>

                      <div style={{
                        backgroundColor: '#ffffff',
                        padding: '10px',
                        borderRadius: '12px',
                        display: 'inline-block',
                        marginBottom: '10px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                      }}>
                        <img
                          src={qrImageSrc}
                          alt="UPI QR Code"
                          style={{ width: '160px', height: '160px', objectFit: 'contain', display: 'block' }}
                          onError={(e) => {
                            if (dynamicQrCodeSrc && e.target.src !== dynamicQrCodeSrc) {
                              e.target.src = dynamicQrCodeSrc;
                            }
                          }}
                        />
                      </div>
                    </>
                  )}

                  {activeOrder.upi_id && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      flexWrap: 'wrap',
                      marginTop: '6px'
                    }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: '800', color: '#043490' }}>
                        {activeOrder.upi_id}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyUpi(activeOrder.upi_id)}
                        className="btn-gold"
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {copied ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copied ? 'COPIED' : 'COPY UPI ID'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      ) : (

        /* ========================================================================= */
        /* SCREEN 2: INITIAL ADD FUND VIEW (ENTER AMOUNT & CLICK PAY NOW)            */
        /* ========================================================================= */
        isAutoMode ? (
          <div>

            {/* Main Deposit Card */}
            <div className="card-glass-v2" style={{ padding: '24px', marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={20} style={{ color: 'var(--color-primary, #043490)' }} />
                  <h5 style={{ color: '#0f172a', fontWeight: '800', margin: 0, fontSize: '1.15rem' }}>
                    Auto UPI Deposit
                  </h5>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: '800',
                    color: '#10b981',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    letterSpacing: '0.04em'
                  }}>
                    DIRECT PAY
                  </span>
                </div>
                <Link
                  to="/deposit-request-status"
                  style={{ color: 'var(--color-primary, #043490)', fontSize: '0.85rem', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <span>Deposit History</span> <ArrowRight size={14} />
                </Link>
              </div>

              {/* Quick Preset Buttons */}
              <div style={{ marginBottom: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px', color: '#334155', fontWeight: '700' }}>
                    <Sparkles size={15} style={{ color: 'var(--color-primary, #043490)' }} />
                    <span>Quick Select Amount (₹)</span>
                  </label>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: '600' }}>
                    Tap to auto-fill
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '10px'
                }}>
                  {PRESET_AMOUNTS.map(preset => {
                    const isSelected = Number(amount) === preset;
                    const isPopular = preset === 500;
                    const isHot = preset === 2000;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        style={{
                          position: 'relative',
                          padding: '12px 6px',
                          borderRadius: '12px',
                          border: isSelected
                            ? '2px solid #043490'
                            : '1px solid #cbd5e1',
                          background: isSelected
                            ? 'rgba(4, 52, 144, 0.08)'
                            : '#f8fafc',
                          color: isSelected ? '#043490' : '#0f172a',
                          fontWeight: '800',
                          fontSize: '1.05rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '2px',
                          boxShadow: isSelected
                            ? '0 0 16px rgba(4, 52, 144, 0.2), 0 2px 6px rgba(0, 0, 0, 0.05)'
                            : '0 1px 3px rgba(0, 0, 0, 0.04)',
                          transform: isSelected ? 'translateY(-2px)' : 'none',
                          outline: 'none'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = '#043490';
                            e.currentTarget.style.backgroundColor = '#f1f5f9';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = '#cbd5e1';
                            e.currentTarget.style.backgroundColor = '#f8fafc';
                            e.currentTarget.style.transform = 'none';
                          }
                        }}
                      >
                        {/* Popular / Best Value Badge */}
                        {isPopular && (
                          <span style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '8px',
                            background: 'linear-gradient(135deg, #ff7b00 0%, #e65100 100%)',
                            color: '#ffffff',
                            fontSize: '0.58rem',
                            fontWeight: '900',
                            padding: '1px 6px',
                            borderRadius: '6px',
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                          }}>
                            POPULAR
                          </span>
                        )}
                        {isHot && (
                          <span style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '8px',
                            background: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
                            color: '#ffffff',
                            fontSize: '0.58rem',
                            fontWeight: '900',
                            padding: '1px 6px',
                            borderRadius: '6px',
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.5)'
                          }}>
                            TOP PICK
                          </span>
                        )}

                        <span style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: '2px',
                          letterSpacing: '0.02em',
                          lineHeight: 1.2
                        }}>
                          <span style={{ fontSize: '0.82rem', opacity: isSelected ? 1 : 0.7, fontWeight: '700' }}>+₹</span>
                          <span>{preset.toLocaleString('en-IN')}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Amount Input */}
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#334155' }}>
                  <span style={{ fontWeight: '700' }}>Deposit Amount (₹) *</span>
                  {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
                    <span style={{ fontSize: '0.78rem', color: amountError ? '#ef4444' : '#043490', fontWeight: '700' }}>
                      Entered: ₹{parseFloat(amount).toFixed(2)}
                    </span>
                  )}
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontWeight: '800',
                    fontSize: '1.25rem',
                    color: amountError ? '#ef4444' : '#043490'
                  }}>
                    ₹
                  </span>
                  <input
                    ref={amountInputRef}
                    type="text"
                    inputMode="decimal"
                    className="form-input"
                    style={{
                      paddingLeft: '40px',
                      fontSize: '1.2rem',
                      fontWeight: '800',
                      borderRadius: '12px',
                      border: amountError
                        ? '1.8px solid #ef4444'
                        : (amount && !isNaN(parseFloat(amount)) && parseFloat(amount) >= (walletInfo?.min_deposite || 100) ? '1.8px solid #10b981' : '1.5px solid #cbd5e1'),
                      background: '#f8fafc',
                      color: '#0f172a',
                      boxShadow: amountError ? '0 0 14px rgba(239, 68, 68, 0.35)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                    placeholder={`Min ₹${Number(walletInfo?.min_deposite || 100).toFixed(2)} - Max ₹${Number(walletInfo?.max_deposite || 50000).toFixed(2)}`}
                    value={amount}
                    onChange={handleAmountChange}
                    onBlur={handleAmountBlur}
                    required
                  />
                </div>

                {/* Inline Validation Error Message Directly Near Amount Field */}
                {amountError ? (
                  <div style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1.5px solid rgba(239, 68, 68, 0.45)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#dc2626',
                    fontSize: '0.84rem',
                    fontWeight: '700',
                    animation: 'fadeIn 0.2s ease-out'
                  }}>
                    <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
                    <span>{amountError}</span>
                  </div>
                ) : (
                  <small style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Minimum: ₹{Number(walletInfo?.min_deposite || 100).toFixed(2)}</span>
                    <span>•</span>
                    <span>Maximum: ₹{Number(walletInfo?.max_deposite || 50000).toFixed(2)}</span>
                  </small>
                )}
              </div>

              {/* Active Automated Gateway Badge */}
              {isAutoMode && paymentConfig?.active_gateway?.gateway_name && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginBottom: '10px',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  color: '#043490',
                  backgroundColor: 'rgba(4, 52, 144, 0.07)',
                  border: '1px solid rgba(4, 52, 144, 0.15)',
                  padding: '6px 14px',
                  borderRadius: '12px'
                }}>
                  <Zap size={14} color="#10b981" />
                  <span>Instant Automated Deposit via <strong>{paymentConfig.active_gateway.gateway_name}</strong></span>
                </div>
              )}

              {/* PRIMARY "PROCEED TO PAY / GENERATE ORDER" BUTTON */}
              <button
                type="button"
                disabled={processingPayment || !amount || parseFloat(amount) <= 0}
                onClick={handlePayNow}
                className="btn-gold"
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '14px',
                  fontSize: '1.08rem',
                  fontWeight: '900',
                  letterSpacing: '0.03em',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 8px 25px rgba(214, 190, 102, 0.4)',
                  cursor: (processingPayment || !amount) ? 'not-allowed' : 'pointer'
                }}
              >
                {processingPayment ? (
                  <>
                    <RefreshCw size={22} className="animate-spin" />
                    <span>GENERATING PAYMENT ORDER...</span>
                  </>
                ) : (
                  <>
                    <Zap size={22} />
                    <span>PAY NOW {amount && Number(amount) > 0 ? `₹${Number(amount).toFixed(2)}` : ''}</span>
                  </>
                )}
              </button>

              {/* Security & Feature Badges */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '14px',
                marginTop: '16px',
                paddingTop: '14px',
                borderTop: '1px solid #e2e8f0',
                fontSize: '0.76rem',
                color: '#64748b',
                flexWrap: 'wrap'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={14} color="#10b981" />
                  <span>Instant Auto Credit</span>
                </span>
                <span>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Smartphone size={14} color="#043490" />
                  <span>Supports All UPI Apps</span>
                </span>
                <span>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Lock size={13} color="#043490" />
                  <span>NPCI UPI 256-Bit</span>
                </span>
              </div>

            </div>
          </div>
        ) : (
          /* ------------------------------------------------------------------------- */
          /* MANUAL MODE VIEW: QR CODE + SUBMIT REQUEST FORM (NO "PAY NOW" BUTTON)     */
          /* ------------------------------------------------------------------------- */
          <div>
            {/* Main Container Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <QrCode size={20} style={{ color: '#043490' }} />
                <h5 style={{ color: '#0f172a', fontWeight: '800', margin: 0, fontSize: '1.15rem' }}>
                  Manual QR & UPI Deposit
                </h5>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: '800',
                  color: '#043490',
                  background: 'rgba(4, 52, 144, 0.08)',
                  border: '1px solid rgba(4, 52, 144, 0.25)',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  letterSpacing: '0.04em'
                }}>
                  MANUAL MODE
                </span>
              </div>
              <Link
                to="/deposit-request-status"
                style={{ color: '#043490', fontSize: '0.85rem', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <span>Deposit History</span> <ArrowRight size={14} />
              </Link>
            </div>

            {/* STEP 1: QR CODE & UPI ADDRESS CARD */}
            <div
              className="card-glass-v2"
              style={{
                padding: '22px 18px',
                borderRadius: '18px',
                marginBottom: '20px',
                textAlign: 'center',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 18px rgba(4, 52, 144, 0.06)'
              }}
            >
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(4, 52, 144, 0.08)',
                border: '1px solid rgba(4, 52, 144, 0.25)',
                padding: '4px 12px',
                borderRadius: '20px',
                color: '#043490',
                fontSize: '0.78rem',
                fontWeight: '800',
                marginBottom: '14px',
                letterSpacing: '0.04em'
              }}>
                <QrCode size={15} />
                <span>STEP 1: SCAN QR OR COPY UPI ID</span>
              </div>

              {/* QR Image Box */}
              <div style={{
                backgroundColor: '#ffffff',
                padding: '14px',
                borderRadius: '16px',
                display: 'inline-block',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0',
                marginBottom: '14px'
              }}>
                <img
                  src={qrImageSrc}
                  alt="Payment QR Code"
                  style={{
                    width: '200px',
                    height: '200px',
                    objectFit: 'contain',
                    display: 'block',
                    margin: '0 auto'
                  }}
                  onError={(e) => {
                    if (dynamicQrCodeSrc && e.target.src !== dynamicQrCodeSrc) {
                      e.target.src = dynamicQrCodeSrc;
                    }
                  }}
                />
              </div>

              <div style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.5, marginBottom: '14px' }}>
                Scan using <strong>Google Pay, PhonePe, Paytm, BHIM</strong> or any UPI App to transfer the deposit amount.
              </div>

              {/* Official UPI ID Box with COPY Button */}
              {activeUpiId && (
                <div
                  onClick={() => handleCopyUpi(activeUpiId)}
                  title="Tap to copy UPI ID"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    backgroundColor: '#f8fafc',
                    border: copied
                      ? '1.5px solid #10b981'
                      : '1.5px solid #cbd5e1',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: copied
                      ? '0 0 16px rgba(16, 185, 129, 0.2)'
                      : '0 2px 6px rgba(0, 0, 0, 0.04)'
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                      Official Payee UPI ID
                    </span>
                    <span style={{
                      fontSize: '0.92rem',
                      fontWeight: '800',
                      color: '#043490',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontFamily: 'monospace, -apple-system, sans-serif',
                      letterSpacing: '0.01em',
                      marginTop: '2px'
                    }}>
                      {activeUpiId}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyUpi(activeUpiId);
                    }}
                    style={{
                      flexShrink: 0,
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: '800',
                      letterSpacing: '0.03em',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer',
                      border: 'none',
                      background: copied
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                        : 'linear-gradient(135deg, #053FA8 0%, #03256C 100%)',
                      color: '#ffffff',
                      boxShadow: copied
                        ? '0 2px 8px rgba(16, 185, 129, 0.4)'
                        : '0 2px 8px rgba(4, 52, 144, 0.35)',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    {copied ? (
                      <>
                        <Check size={14} />
                        <span>COPIED!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>COPY</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* STEP 2: DEPOSIT REQUEST SUBMISSION FORM (NOT COLLAPSED, DIRECTLY OPEN!) */}
            <div
              className="card-glass-v2"
              style={{
                padding: '24px',
                borderRadius: '18px',
                marginBottom: '22px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 18px rgba(4, 52, 144, 0.06)'
              }}
            >
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                padding: '4px 12px',
                borderRadius: '20px',
                color: '#059669',
                fontSize: '0.78rem',
                fontWeight: '800',
                marginBottom: '12px',
                letterSpacing: '0.04em'
              }}>
                <FileText size={15} />
                <span>STEP 2: SUBMIT DEPOSIT REQUEST</span>
              </div>

              <h5 style={{ color: '#0f172a', fontWeight: '800', margin: '0 0 6px 0', fontSize: '1.1rem' }}>
                Submit 12-Digit UTR for Verification
              </h5>
              <p style={{ color: '#475569', fontSize: '0.84rem', marginBottom: '20px', lineHeight: 1.45 }}>
                Enter the amount transferred and the 12-digit UTR reference number from your Google Pay, PhonePe, or Paytm receipt. Admin will verify and approve your request.
              </p>

              <form onSubmit={(e) => handleSubmitUtr(e, 'manual')}>
                {/* Amount Selection Chips */}
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label className="form-label" style={{ margin: 0, fontSize: '0.84rem' }}>
                      Select Amount (₹) *
                    </label>
                    <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: '600' }}>
                      Tap to auto-fill
                    </span>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px'
                  }}>
                    {PRESET_AMOUNTS.map(preset => {
                      const isSelected = Number(amount) === preset;
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          style={{
                            padding: '10px 4px',
                            borderRadius: '10px',
                            border: isSelected
                              ? '2px solid #043490'
                              : '1px solid #cbd5e1',
                            background: isSelected
                              ? 'rgba(4, 52, 144, 0.08)'
                              : '#ffffff',
                            color: isSelected ? '#043490' : '#1e293b',
                            fontWeight: '800',
                            fontSize: '0.96rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          +₹{preset.toLocaleString('en-IN')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Amount Input */}
                <div className="form-group" style={{ marginBottom: '18px' }}>
                  <label className="form-label" style={{ fontSize: '0.84rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '700' }}>Deposit Amount (₹) *</span>
                    {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
                      <span style={{ fontSize: '0.78rem', color: amountError ? '#ef4444' : '#043490', fontWeight: '700' }}>
                        Entered: ₹{parseFloat(amount).toFixed(2)}
                      </span>
                    )}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontWeight: '800',
                      fontSize: '1.2rem',
                      color: amountError ? '#ef4444' : '#043490'
                    }}>
                      ₹
                    </span>
                    <input
                      ref={amountInputRef}
                      type="text"
                      inputMode="decimal"
                      className="form-input"
                      style={{
                        paddingLeft: '38px',
                        fontSize: '1.1rem',
                        fontWeight: '800',
                        borderRadius: '12px',
                        borderColor: amountError ? '#ef4444' : '#cbd5e1',
                        background: '#ffffff',
                        color: '#0f172a'
                      }}
                      placeholder={`Min ₹${Number(walletInfo?.min_deposite || 100).toFixed(2)} - Max ₹${Number(walletInfo?.max_deposite || 50000).toFixed(2)}`}
                      value={amount}
                      onChange={handleAmountChange}
                      onBlur={handleAmountBlur}
                      required
                    />
                  </div>
                  {amountError && (
                    <div style={{
                      backgroundColor: '#fef2f2',
                      border: '1.5px solid #fecaca',
                      borderRadius: '10px',
                      padding: '8px 12px',
                      marginTop: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#b91c1c',
                      fontSize: '0.82rem',
                      fontWeight: '700'
                    }}>
                      <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0 }} />
                      <span>{amountError}</span>
                    </div>
                  )}
                </div>

                {/* 12-Digit UTR Reference Input */}
                <div className="form-group" style={{ marginBottom: '18px' }}>
                  <label className="form-label" style={{ fontSize: '0.84rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700' }}>12-Digit UTR / Ref No *</span>
                    {utrNo && (
                      <span style={{
                        fontSize: '0.74rem',
                        fontWeight: '800',
                        color: utrNo.length === 12 ? '#059669' : '#d97706',
                        background: utrNo.length === 12 ? '#ecfdf5' : '#fffbeb',
                        padding: '2px 8px',
                        borderRadius: '8px'
                      }}>
                        {utrNo.length} / 12 digits
                      </span>
                    )}
                  </label>
                  <input
                    ref={manualUtrInputRef}
                    type="text"
                    maxLength="12"
                    inputMode="numeric"
                    className="form-input"
                    style={{
                      fontSize: '1.1rem',
                      letterSpacing: '0.08em',
                      fontWeight: '800',
                      borderColor: utrError ? '#ef4444' : (utrNo.length === 12 ? '#059669' : '#cbd5e1'),
                      boxShadow: utrError ? '0 0 10px rgba(239, 68, 68, 0.2)' : (utrNo.length === 12 ? '0 0 10px rgba(5, 150, 105, 0.2)' : 'none'),
                      transition: 'all 0.2s ease',
                      background: '#ffffff',
                      color: '#0f172a'
                    }}
                    placeholder="e.g. 423456789012"
                    value={utrNo}
                    onChange={handleUtrChange}
                    onBlur={handleUtrBlur}
                    required
                  />
                  {utrError ? (
                    <div style={{
                      backgroundColor: '#fef2f2',
                      border: '1.5px solid #fecaca',
                      borderRadius: '10px',
                      padding: '8px 12px',
                      marginTop: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#b91c1c',
                      fontSize: '0.82rem',
                      fontWeight: '700'
                    }}>
                      <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0 }} />
                      <span>{utrError}</span>
                    </div>
                  ) : (
                    <small style={{ color: '#64748b', fontSize: '0.76rem', marginTop: '6px', display: 'block' }}>
                      12-digit numeric reference number from Google Pay, PhonePe, or Paytm receipt.
                    </small>
                  )}
                </div>

                {/* Payment Screenshot Upload */}
                <div className="form-group" style={{ marginBottom: '22px' }}>
                  <label className="form-label" style={{ fontSize: '0.84rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700' }}>Payment Screenshot (Optional)</span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>JPG, PNG, WEBP (Max 5MB)</span>
                  </label>

                  {!selectedFile ? (
                    <input
                      ref={manualFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,image/webp"
                      className="form-input"
                      style={{
                        borderColor: fileError ? '#ef4444' : '#cbd5e1',
                        padding: '10px',
                        fontSize: '0.85rem'
                      }}
                      onChange={handleFileChange}
                    />
                  ) : (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      backgroundColor: '#ecfdf5',
                      border: '1.5px solid #a7f3d0',
                      borderRadius: '10px',
                      gap: '10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                        <CheckCircle2 size={18} color="#059669" style={{ flexShrink: 0 }} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            color: '#0f172a',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {selectedFile.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#047857' }}>
                            {selectedFile.size} • Attached
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        title="Remove file"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc2626',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}

                  {fileError && (
                    <div style={{
                      backgroundColor: '#fef2f2',
                      border: '1.5px solid #fecaca',
                      borderRadius: '10px',
                      padding: '8px 12px',
                      marginTop: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#b91c1c',
                      fontSize: '0.82rem',
                      fontWeight: '700'
                    }}>
                      <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0 }} />
                      <span>{fileError}</span>
                    </div>
                  )}
                </div>

                {/* Submit Deposit Request Button */}
                <button
                  type="submit"
                  disabled={submittingUtr || !utrNo || !amount || parseFloat(amount) <= 0}
                  style={{
                    width: '100%',
                    padding: '15px',
                    borderRadius: '14px',
                    fontSize: '1.05rem',
                    fontWeight: '800',
                    letterSpacing: '0.03em',
                    cursor: (submittingUtr || !utrNo || !amount) ? 'not-allowed' : 'pointer',
                    opacity: (utrNo && amount) ? 1 : 0.65,
                    background: 'linear-gradient(135deg, #053FA8 0%, #03256C 100%)',
                    color: '#ffffff',
                    border: 'none',
                    boxShadow: '0 6px 20px rgba(4, 52, 144, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {submittingUtr ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>SUBMITTING DEPOSIT REQUEST...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      <span>SUBMIT DEPOSIT REQUEST {amount && Number(amount) > 0 ? `(₹${Number(amount).toFixed(2)})` : ''}</span>
                    </>
                  )}
                </button>
              </form>

              {/* Note banner */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '16px',
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: '0.78rem',
                color: '#475569'
              }}>
                <ShieldCheck size={16} color="#059669" style={{ flexShrink: 0 }} />
                <span>Admin verifies deposit requests manually in <strong>Fund Request</strong> tab and credits your wallet.</span>
              </div>
            </div>
          </div>
        )
      )}

    </div>
  );
};

export default AddFund;
