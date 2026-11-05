import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Headphones,
  ShieldCheck,
  Zap,
  CheckCheck,
  Check,
  Sparkles,
  RefreshCw,
  HelpCircle,
  Paperclip,
  Image as ImageIcon,
  Mic,
  Square,
  Trash2,
  Play,
  Pause,
  Download,
  FileText,
  X,
  Maximize2,
  ExternalLink
} from 'lucide-react';
import api from '../utils/api';
import chatSocket from '../utils/chatSocket';

const WhatsAppIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.11 7.03C8.92 7.03 8.61 7.1 8.36 7.37C8.11 7.64 7.41 8.3 7.41 9.64C7.41 10.98 8.39 12.27 8.52 12.45C8.66 12.63 10.43 15.36 13.15 16.53C13.79 16.81 14.3 16.98 14.69 17.11C15.34 17.31 15.93 17.29 16.4 17.22C16.92 17.14 18 16.56 18.23 15.91C18.46 15.26 18.46 14.7 18.39 14.59C18.32 14.47 18.13 14.41 17.85 14.27C17.57 14.13 16.2 13.45 15.94 13.36C15.69 13.27 15.5 13.22 15.32 13.5C15.13 13.77 14.6 14.41 14.44 14.59C14.28 14.78 14.12 14.8 13.84 14.66C13.56 14.53 12.67 14.23 11.62 13.29C10.79 12.55 10.23 11.64 10.07 11.36C9.91 11.09 10.05 10.93 10.2 10.79C10.32 10.67 10.48 10.46 10.62 10.3C10.76 10.13 10.8 10.02 10.89 9.83C10.99 9.65 10.94 9.48 10.87 9.35C10.8 9.21 10.24 7.84 10.01 7.28C9.78 6.74 9.55 6.81 9.38 6.81C9.22 6.81 9.03 6.8 8.85 6.8L9.11 7.03Z" />
  </svg>
);

const QUICK_QUERIES = [
  '⚡ Deposit Not Reflected',
  '💸 Withdrawal Processing Status',
  '🔑 MPIN or Password Reset Help',
  '🎯 Game Winning Verification',
  '📋 How to Place a Bid'
];

// Audio message player bubble component
const ChatAudioPlayer = ({ src, isUser }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => setDuration(audio.duration || 0);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime || 0);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => { });
    }
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '4px 0',
      minWidth: '220px'
    }}>
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        type="button"
        onClick={togglePlay}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: isUser ? '#ffffff' : '#043490',
          color: isUser ? '#00a843' : '#ffffff',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
        }}
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: '2px' }} />}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Progress Bar */}
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            if (audioRef.current && duration > 0) {
              audioRef.current.currentTime = clickPos * duration;
            }
          }}
          style={{
            height: '6px',
            backgroundColor: isUser ? 'rgba(255,255,255,0.35)' : '#e2e8f0',
            borderRadius: '4px',
            cursor: 'pointer',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <div style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: isUser ? '#ffffff' : '#043490',
            borderRadius: '4px',
            transition: 'width 0.1s linear'
          }} />
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.7rem',
          marginTop: '4px',
          color: isUser ? 'rgba(255,255,255,0.85)' : '#64748b',
          fontWeight: '600'
        }}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

const Support = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [adminTyping, setAdminTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [wpNumber, setWpNumber] = useState('');

  // User and Guest Auth
  const [userPhone, setUserPhone] = useState(() => {
    return localStorage.getItem('phone') || sessionStorage.getItem('support_guest_phone') || '';
  });
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('name') || sessionStorage.getItem('support_guest_name') || 'Player';
  });
  const [guestPhoneInput, setGuestPhoneInput] = useState('');

  // Attachment (File/Image) State
  const [selectedFile, setSelectedFile] = useState(null); // { name, type, size, base64 }
  const [previewImage, setPreviewImage] = useState(null); // for Lightbox zoom modal
  const fileInputRef = useRef(null);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const cancelRecordingRef = useRef(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const handleGuestSubmit = (e) => {
    e.preventDefault();
    const clean = guestPhoneInput.replace(/\D/g, '');
    if (clean.length >= 10) {
      sessionStorage.setItem('support_guest_phone', clean);
      sessionStorage.setItem('support_guest_name', 'Guest Player');
      setUserPhone(clean);
      setUserName('Guest Player');
    }
  };

  const scrollToBottom = (behavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
  };

  // 1. Load chat history & admin contact info
  useEffect(() => {
    let isMounted = true;

    const fetchHistoryAndInfo = async () => {
      try {
        const [appRes, walletRes] = await Promise.all([
          api.get('/app-info').catch(() => null),
          api.get('/wallet/info').catch(() => null)
        ]);

        if (isMounted) {
          const appData = appRes?.data?.data || {};
          const walletData = walletRes?.data?.data || {};
          const num = appData.wp_mobile || walletData.admin_wp || walletData.admin_mobile || appData.mobile || '';
          if (num) setWpNumber(num);
        }

        if (userPhone) {
          const res = await api.get(`/chat/history?phone=${userPhone}`);
          if (isMounted && res.data?.success === '1' && Array.isArray(res.data.data)) {
            setMessages(res.data.data);
            setTimeout(() => scrollToBottom('auto'), 150);
          }
        }
      } catch (err) {
        console.error('Support fetch error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchHistoryAndInfo();

    return () => {
      isMounted = false;
    };
  }, [userPhone]);

  // Direct WhatsApp Connect Handler
  const handleOpenWhatsApp = (customText = '') => {
    const cleanWp = String(wpNumber || '').replace(/\D/g, '');
    const finalWp = cleanWp.startsWith('91') && cleanWp.length > 10 ? cleanWp : (cleanWp ? `91${cleanWp}` : '919876543210');
    const defaultMsg = `Hello Bharat Matka Support, I need assistance.${userName ? ` My name is ${userName}.` : ''}${userPhone ? ` Registered Mobile: ${userPhone}.` : ''}`;
    const textToSend = customText || defaultMsg;
    const url = `https://wa.me/${finalWp}?text=${encodeURIComponent(textToSend)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // 2. Connect to In-App WebSocket Chat
  useEffect(() => {
    if (!userPhone) return;

    chatSocket.init({
      phone: userPhone,
      role: 'user',
      name: userName
    });

    const unsubStatus = chatSocket.onStatus((status) => {
      setConnectionStatus(status);
    });

    const unsubMsg = chatSocket.onMessage((newMsg, tempId) => {
      const myCleanPhone = String(userPhone || '').replace(/\D/g, '');
      const msgCleanPhone = String(newMsg?.user_phone || '').replace(/\D/g, '');

      if (newMsg && myCleanPhone && myCleanPhone === msgCleanPhone) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          if (tempId && prev.some((m) => m.id === tempId)) {
            return prev.map((m) => (m.id === tempId ? newMsg : m));
          }
          const optIdx = prev.findIndex(
            (m) =>
              String(m.id).startsWith('temp_') &&
              m.sender_type === newMsg.sender_type &&
              m.message === newMsg.message
          );
          if (optIdx !== -1) {
            const next = [...prev];
            next[optIdx] = newMsg;
            return next;
          }
          return [...prev, newMsg];
        });
        setTimeout(() => scrollToBottom('smooth'), 100);

        if (newMsg.sender_type === 'admin') {
          chatSocket.markRead(myCleanPhone);
        }
      }
    });

    const unsubTyping = chatSocket.onTyping((data) => {
      if (data.sender_type === 'admin') {
        setAdminTyping(data.isTyping);
      }
    });

    const unsubRead = chatSocket.onRead(() => {
      setMessages((prev) =>
        prev.map((m) => (m.sender_type === 'user' ? { ...m, is_read: 1 } : m))
      );
    });

    return () => {
      unsubStatus();
      unsubMsg();
      unsubTyping();
      unsubRead();
    };
  }, [userPhone, userName]);

  // Handle File Selection (Photo / Screenshot / Document)
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit to 15MB
    if (file.size > 15 * 1024 * 1024) {
      alert('Selected file is too large. Please select a file under 15MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedFile({
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        size: (file.size / 1024).toFixed(1) + ' KB',
        base64: reader.result
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Microphone Voice Recording Handlers
  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Audio recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      cancelRecordingRef.current = false;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        if (cancelRecordingRef.current) {
          cancelRecordingRef.current = false;
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleSendVoiceNote(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone error:', err);
      alert('Please allow microphone permissions to record voice messages.');
    }
  };

  const stopAndSendRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      cancelRecordingRef.current = false;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      cancelRecordingRef.current = true;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  const handleSendVoiceNote = async (audioBlob) => {
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Data = reader.result;
      setIsSending(true);
      try {
        const uploadRes = await chatSocket.uploadFile(base64Data, `voice_${Date.now()}.webm`, 'audio');
        const fileUrl = uploadRes?.url || base64Data;

        await handleSendMessage('', {
          message_type: 'audio',
          attachment_url: fileUrl,
          file_name: `Voice Note (${recordingTime}s)`
        });
      } catch (err) {
        console.error('Voice send error:', err);
      } finally {
        setIsSending(false);
      }
    };
  };

  // Handle message sending (Text, Image, File, Audio)
  const handleSendMessage = async (textToSend, customPayload = null) => {
    const text = (textToSend || inputText).trim();
    if (!userPhone || isSending) return;

    let msgType = customPayload?.message_type || (selectedFile ? selectedFile.type : 'text');
    let attachmentUrl = customPayload?.attachment_url || null;
    let fileName = customPayload?.file_name || (selectedFile ? selectedFile.name : null);

    if (!text && !attachmentUrl && !selectedFile) return;

    setIsSending(true);
    setInputText('');

    // If a file was picked in the UI
    if (selectedFile && !attachmentUrl) {
      const uploadRes = await chatSocket.uploadFile(selectedFile.base64, selectedFile.name, selectedFile.type);
      attachmentUrl = uploadRes?.url || selectedFile.base64;
      fileName = selectedFile.name;
      msgType = selectedFile.type;
      setSelectedFile(null);
    }

    const tempId = 'temp_' + Date.now();
    const tempMsg = {
      id: tempId,
      user_phone: userPhone,
      sender_type: 'user',
      sender_name: userName,
      message: text || (msgType === 'image' ? '📷 Photo' : (msgType === 'audio' ? '🎤 Voice Message' : '📎 Attachment')),
      message_type: msgType,
      attachment_url: attachmentUrl,
      file_name: fileName,
      is_read: 0,
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, tempMsg]);
    setTimeout(() => scrollToBottom('smooth'), 50);

    try {
      chatSocket.sendTyping(false, userPhone);
      const savedMsg = await chatSocket.sendMessage({
        message: text,
        message_type: msgType,
        attachment_url: attachmentUrl,
        file_name: fileName,
        phone: userPhone,
        sender_name: userName,
        tempId: tempId
      });

      if (savedMsg) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? savedMsg : m))
        );
      }
    } catch (err) {
      console.error('Failed to send chat message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (userPhone) {
      chatSocket.sendTyping(true, userPhone);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        chatSocket.sendTyping(false, userPhone);
      }, 2000);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div style={{
      maxWidth: '740px',
      margin: '0 auto',
      padding: '12px 14px 20px',
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 84px)',
      maxHeight: '860px'
    }}>
      {/* Hidden File Picker Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*,.pdf,.doc,.docx"
        style={{ display: 'none' }}
      />

      {/* Top Header Card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          marginBottom: '10px',
          borderRadius: '16px',
          flexShrink: 0,
          background: 'linear-gradient(135deg, #053FA8 0%, #03256C 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 16px rgba(4, 52, 144, 0.25)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.18)',
              color: '#ffffff',
              textDecoration: 'none'
            }}
          >
            <ArrowLeft size={18} />
          </Link>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #FF6B00 0%, #E65A00 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 3px 12px rgba(255, 107, 0, 0.35)'
            }}>
              <Headphones size={20} />
            </div>
            <span style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: connectionStatus === 'connected' ? '#10b981' : '#f59e0b',
              border: '2px solid #ffffff'
            }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#ffffff', margin: 0 }}>
                Live Support Chat
              </h3>
              <span style={{
                fontSize: '0.66rem',
                padding: '2px 8px',
                borderRadius: '10px',
                background: connectionStatus === 'connected' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)',
                color: connectionStatus === 'connected' ? '#34d399' : '#fde68a',
                fontWeight: '800'
              }}>
                {connectionStatus === 'connected' ? 'ONLINE' : 'CONNECTING'}
              </span>
            </div>
            <p style={{ fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.82)', margin: '2px 0 0 0' }}>
              Official Bharat Matka Help Desk
            </p>
          </div>
        </div>

        {/* 1-Tap Direct WhatsApp Connect Button */}
        <button
          type="button"
          onClick={() => handleOpenWhatsApp()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#25D366',
            color: '#ffffff',
            border: 'none',
            padding: '7px 14px',
            borderRadius: '50px',
            fontSize: '0.78rem',
            fontWeight: '800',
            cursor: 'pointer',
            boxShadow: '0 3px 10px rgba(37, 211, 102, 0.35)',
            transition: 'transform 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <WhatsAppIcon size={16} color="#ffffff" />
          <span>WhatsApp</span>
        </button>
      </div>

      {/* Main Chat Box Card */}
      <div
        className="card-glass-v2"
        style={{
          flex: '1 1 0%',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          borderRadius: '18px',
          padding: '12px 14px',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(4, 52, 144, 0.06)'
        }}
      >
        {/* Messages Scroll Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: '6px',
          paddingBottom: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          backgroundColor: '#f8fafc',
          borderRadius: '14px',
          padding: '12px'
        }}>
          {/* Welcome & Fast WhatsApp Banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            padding: '12px 14px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(4, 52, 144, 0.05) 0%, rgba(37, 211, 102, 0.08) 100%)',
            border: '1px solid rgba(4, 52, 144, 0.15)',
            marginBottom: '4px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(4, 52, 144, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#043490',
                flexShrink: 0
              }}>
                <Sparkles size={16} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.84rem', color: '#0f172a', margin: '0 0 2px', fontWeight: '800' }}>
                  24×7 Instant Support
                </h4>
                <p style={{ fontSize: '0.74rem', color: '#64748b', margin: 0 }}>
                  Chat live here, or connect directly on WhatsApp with our team.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenWhatsApp()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '20px',
                border: 'none',
                background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                color: '#ffffff',
                fontSize: '0.76rem',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(37, 211, 102, 0.3)'
              }}
            >
              <WhatsAppIcon size={14} color="#ffffff" />
              <span>Connect on WhatsApp</span>
            </button>
          </div>

          {!userPhone ? (
            <div style={{
              margin: 'auto',
              maxWidth: '380px',
              padding: '24px 20px',
              borderRadius: '16px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              textAlign: 'center',
              boxShadow: '0 4px 16px rgba(0,0,0,0.05)'
            }}>
              <Headphones size={36} style={{ color: '#043490', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1.05rem', color: '#0f172a', margin: '0 0 6px', fontWeight: '800' }}>
                Start Live Support Chat
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 16px', lineHeight: '1.4' }}>
                Please enter your 10-digit mobile number to connect directly with our support team in real time.
              </p>
              <form onSubmit={handleGuestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="Enter 10-Digit Mobile Number"
                  value={guestPhoneInput}
                  onChange={(e) => setGuestPhoneInput(e.target.value.replace(/\D/g, ''))}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: '#f8fafc',
                    border: '1.5px solid #cbd5e1',
                    color: '#0f172a',
                    fontSize: '0.95rem',
                    textAlign: 'center',
                    fontWeight: '700',
                    outline: 'none',
                    letterSpacing: '1px'
                  }}
                  required
                />
                <button
                  type="submit"
                  disabled={guestPhoneInput.length < 10}
                  style={{
                    padding: '12px',
                    borderRadius: '50px',
                    border: 'none',
                    background: guestPhoneInput.length >= 10 ? 'linear-gradient(135deg, #053FA8 0%, #03256C 100%)' : '#e2e8f0',
                    color: guestPhoneInput.length >= 10 ? '#ffffff' : '#94a3b8',
                    fontWeight: '800',
                    fontSize: '0.92rem',
                    cursor: guestPhoneInput.length >= 10 ? 'pointer' : 'not-allowed',
                    boxShadow: guestPhoneInput.length >= 10 ? '0 4px 14px rgba(4, 52, 144, 0.25)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  Connect With Support
                </button>
              </form>
            </div>
          ) : loading ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b' }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px', color: '#043490' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>Loading conversation history...</div>
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b' }}>
              <HelpCircle size={36} style={{ margin: '0 auto 10px', color: '#043490', opacity: 0.5 }} />
              <p style={{ fontSize: '0.9rem', fontWeight: '600', margin: 0, color: '#334155' }}>
                No messages yet. Ask a question or send a screenshot to get started!
              </p>
            </div>
          ) : (
            messages.map((m, index) => {
              const isUser = m.sender_type === 'user';
              const isAudio = m.message_type === 'audio';
              const isImage = m.message_type === 'image' || (m.attachment_url && m.attachment_url.match(/\.(jpg|jpeg|png|webp|gif)/i));
              const isFile = m.message_type === 'file' && !isImage && !isAudio;

              return (
                <div
                  key={m.id || index}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    alignSelf: isUser ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div
                    style={{
                      padding: isImage ? '6px' : '10px 14px',
                      borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: isUser
                        ? 'linear-gradient(135deg, #00A843 0%, #008736 100%)'
                        : '#ffffff',
                      color: isUser ? '#ffffff' : '#0f172a',
                      border: isUser ? 'none' : '1px solid #e2e8f0',
                      fontSize: '0.88rem',
                      lineHeight: '1.45',
                      wordBreak: 'break-word',
                      boxShadow: isUser
                        ? '0 3px 12px rgba(0, 168, 67, 0.2)'
                        : '0 2px 10px rgba(0, 0, 0, 0.05)',
                      overflow: 'hidden'
                    }}
                  >
                    {!isUser && (
                      <div style={{
                        fontSize: '0.72rem',
                        fontWeight: '800',
                        color: '#043490',
                        marginBottom: '4px',
                        padding: isImage ? '4px 6px' : '0'
                      }}>
                        {m.sender_name || 'Bharat Matka Support'}
                      </div>
                    )}

                    {/* Image Attachment */}
                    {isImage && m.attachment_url && (
                      <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setPreviewImage(m.attachment_url)}>
                        <img
                          src={m.attachment_url}
                          alt="Attachment"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '220px',
                            borderRadius: '12px',
                            display: 'block',
                            objectFit: 'cover'
                          }}
                        />
                        <div style={{
                          position: 'absolute',
                          right: '8px',
                          bottom: '8px',
                          background: 'rgba(0,0,0,0.65)',
                          borderRadius: '6px',
                          padding: '4px',
                          color: '#fff',
                          display: 'flex'
                        }}>
                          <Maximize2 size={13} />
                        </div>
                      </div>
                    )}

                    {/* Audio Voice Note */}
                    {isAudio && m.attachment_url && (
                      <ChatAudioPlayer src={m.attachment_url} isUser={isUser} />
                    )}

                    {/* Generic File Attachment */}
                    {isFile && m.attachment_url && (
                      <a
                        href={m.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                        download
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          background: isUser ? 'rgba(255,255,255,0.2)' : '#f8fafc',
                          border: isUser ? 'none' : '1px solid #e2e8f0',
                          borderRadius: '8px',
                          color: isUser ? '#ffffff' : '#043490',
                          textDecoration: 'none',
                          fontSize: '0.82rem',
                          fontWeight: '700'
                        }}
                      >
                        <FileText size={18} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                          {m.file_name || 'Download Attachment'}
                        </span>
                        <Download size={14} style={{ marginLeft: 'auto' }} />
                      </a>
                    )}

                    {/* Text Message Content */}
                    {m.message && (!isImage || m.message !== '📷 Photo') && (!isAudio || m.message !== '🎤 Voice Message') && (!isFile || m.message !== '📎 Attachment') && (
                      <div style={{
                        marginTop: (isImage || isAudio || isFile) ? '6px' : '0',
                        padding: isImage ? '0 6px 4px' : '0',
                        fontWeight: '500'
                      }}>
                        {m.message}
                      </div>
                    )}
                  </div>

                  {/* Timestamp & Read Receipt */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.68rem',
                    color: '#64748b',
                    marginTop: '3px',
                    padding: '0 4px',
                    fontWeight: '600'
                  }}>
                    <span>
                      {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                    </span>
                    {isUser && (
                      m.is_read ? (
                        <CheckCheck size={14} style={{ color: '#043490' }} />
                      ) : (
                        <Check size={14} style={{ color: '#94a3b8' }} />
                      )
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Typing Indicator Bubble */}
          {adminTyping && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '16px 16px 16px 4px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              width: 'fit-content'
            }}>
              <span style={{ fontSize: '0.75rem', color: '#043490', fontWeight: '700' }}>
                Support is typing...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Selected File Preview Box (Before Send) */}
        {selectedFile && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '12px',
            margin: '8px 0 4px',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              {selectedFile.type === 'image' ? (
                <img
                  src={selectedFile.base64}
                  alt="preview"
                  style={{ width: '38px', height: '38px', borderRadius: '6px', objectFit: 'cover' }}
                />
              ) : (
                <FileText size={24} style={{ color: '#00a843' }} />
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.82rem', color: '#0f172a', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedFile.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  {selectedFile.size}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              style={{
                background: '#fee2e2',
                border: 'none',
                color: '#dc2626',
                padding: '4px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex'
              }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Quick Question Chips */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          padding: '8px 0 6px',
          flexShrink: 0,
          scrollbarWidth: 'none'
        }}>
          {QUICK_QUERIES.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(q)}
              style={{
                flexShrink: 0,
                padding: '5px 12px',
                borderRadius: '20px',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                color: '#334155',
                fontSize: '0.75rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#043490';
                e.currentTarget.style.color = '#043490';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.color = '#334155';
              }}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar or Voice Recording Bar */}
        {isRecording ? (
          /* Live Voice Recording UI Bar */
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            marginTop: '6px',
            padding: '10px 14px',
            borderRadius: '14px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#dc2626',
                animation: 'pulse 1s infinite'
              }} />
              <span style={{ color: '#b91c1c', fontSize: '0.88rem', fontWeight: '800' }}>
                Recording Audio... {Math.floor(recordingTime / 60)}:{(recordingTime % 60) < 10 ? '0' : ''}{recordingTime % 60}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={cancelRecording}
                title="Cancel Recording"
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  cursor: 'pointer',
                  display: 'flex'
                }}
              >
                <Trash2 size={18} />
              </button>

              <button
                type="button"
                onClick={stopAndSendRecording}
                title="Send Voice Note"
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #00A843 0%, #008736 100%)',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(0, 168, 67, 0.3)'
                }}
              >
                <Send size={16} />
                <span>Send</span>
              </button>
            </div>
          </div>
        ) : (
          /* Normal Message Input Bar */
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '6px',
            paddingTop: '8px',
            borderTop: '1px solid #f1f5f9',
            flexShrink: 0
          }}>
            {/* File Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={!userPhone}
              title="Attach Photo or Document"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                color: '#043490',
                cursor: userPhone ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
            >
              <Paperclip size={18} />
            </button>

            {/* Microphone Voice Note Button */}
            <button
              type="button"
              onClick={startRecording}
              disabled={!userPhone}
              title="Record Voice Note"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                color: '#00a843',
                cursor: userPhone ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
            >
              <Mic size={18} />
            </button>

            {/* Input Field */}
            <input
              type="text"
              placeholder={userPhone ? (selectedFile ? "Add caption to file..." : "Type your message...") : "Enter mobile number above..."}
              value={inputText}
              disabled={!userPhone}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              style={{
                flex: 1,
                height: '44px',
                borderRadius: '12px',
                padding: '0 14px',
                fontSize: '0.9rem',
                backgroundColor: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                color: '#0f172a',
                fontWeight: '600',
                outline: 'none',
                opacity: userPhone ? 1 : 0.6
              }}
            />

            {/* Send Button */}
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!userPhone || (!inputText.trim() && !selectedFile) || isSending}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                border: 'none',
                background: (inputText.trim() || selectedFile) && userPhone
                  ? 'linear-gradient(135deg, #ff7a00 0%, #e65a00 100%)'
                  : '#e2e8f0',
                color: (inputText.trim() || selectedFile) && userPhone ? '#ffffff' : '#94a3b8',
                cursor: (inputText.trim() || selectedFile) && userPhone ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: (inputText.trim() || selectedFile) && userPhone ? '0 4px 12px rgba(255, 122, 0, 0.3)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Send size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Lightbox Preview Modal for Zooming Images */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <button
              onClick={() => setPreviewImage(null)}
              style={{
                position: 'absolute',
                top: '-36px',
                right: '0',
                background: 'none',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer'
              }}
            >
              <X size={24} />
            </button>
            <img
              src={previewImage}
              alt="Full Preview"
              style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '8px', objectFit: 'contain' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Support;
