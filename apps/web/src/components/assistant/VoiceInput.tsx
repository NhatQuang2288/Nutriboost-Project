'use client'

import { useEffect, useRef, useState } from 'react'

interface VoiceInputProps {
  onResult: (text: string) => void
}

/*
 * ============================================
 * TYPE CHO SPEECH RECOGNITION
 * ============================================
 */

interface SpeechRecognitionEventLike {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEventLike {
  error: string
}

interface SpeechRecognitionInstance {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number

  start(): void
  stop(): void

  onstart: (() => void) | null

  onresult:
    | ((event: SpeechRecognitionEventLike) => void)
    | null

  onerror:
    | ((event: SpeechRecognitionErrorEventLike) => void)
    | null

  onend: (() => void) | null
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance
}

/*
 * ============================================
 * KHAI BÁO SPEECH RECOGNITION CHO WINDOW
 * ============================================
 */

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor

    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

/*
 * ============================================
 * CẤU HÌNH
 * ============================================
 */

// Thời gian tối đa: 10 giây
const MAX_RECORDING_TIME = 10_000

// Hiển thị countdown từ 10
const MAX_SECONDS = 10

/*
 * ============================================
 * COMPONENT
 * ============================================
 */

export function VoiceInput({
  onResult,
}: VoiceInputProps) {
  /*
   * --------------------------------------------
   * STATE
   * --------------------------------------------
   */

  const [isListening, setIsListening] =
    useState(false)

  const [remainingTime, setRemainingTime] =
    useState(MAX_SECONDS)

  /*
   * --------------------------------------------
   * REFS
   * --------------------------------------------
   */

  // Speech Recognition hiện tại
  const recognitionRef =
    useRef<SpeechRecognitionInstance | null>(
      null,
    )

  // Trạng thái microphone
  const isListeningRef =
    useRef(false)

  // Phần text đã được Speech Recognition xác nhận
  const finalTextRef =
    useRef('')

  // Phần text đang nhận tạm thời
  const interimTextRef =
    useRef('')

  // Timer countdown
  const timerRef =
    useRef<ReturnType<typeof setInterval> | null>(
      null,
    )

  // Timeout 10 giây
  const timeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null,
    )

  // Tránh finishListening chạy nhiều lần
  const finishingRef =
    useRef(false)

  /*
   * ============================================
   * XÓA TIMER
   * ============================================
   */

  const clearTimers = () => {
    /*
     * Xóa countdown
     */
    if (timerRef.current !== null) {
      clearInterval(timerRef.current)

      timerRef.current = null
    }

    /*
     * Xóa timeout 10 giây
     */
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current)

      timeoutRef.current = null
    }
  }

  /*
   * ============================================
   * LẤY TOÀN BỘ TEXT
   * ============================================
   */

  const getCurrentText = () => {
    const text =
      finalTextRef.current +
      interimTextRef.current

    return text.trim()
  }

  /*
   * ============================================
   * HOÀN TẤT NHẬP GIỌNG NÓI
   * ============================================
   */

  const finishListening = () => {
    /*
     * Nếu đã finish rồi thì không làm lại
     */
    if (finishingRef.current) {
      return
    }

    finishingRef.current = true

    /*
     * Đánh dấu microphone đã dừng
     */
    isListeningRef.current = false

    /*
     * Dừng timer
     */
    clearTimers()

    /*
     * Dừng Speech Recognition
     */
    try {
      recognitionRef.current?.stop()
    } catch {
      // Recognition có thể đã tự dừng
    }

    /*
     * Cập nhật UI
     */
    setIsListening(false)

    setRemainingTime(MAX_SECONDS)

    /*
     * Lấy toàn bộ text
     *
     * Ví dụ:
     *
     * final:
     * "Tôi muốn ăn"
     *
     * interim:
     * "phở bò"
     *
     * kết quả:
     * "Tôi muốn ăn phở bò"
     */
    const finalText =
      getCurrentText()

    console.log(
      '🎤 Kết quả cuối cùng:',
      finalText,
    )

    /*
     * Đưa text ra component cha
     */
    if (finalText.length > 0) {
      onResult(finalText)
    }

    /*
     * Reset dữ liệu
     */
    finalTextRef.current = ''

    interimTextRef.current = ''

    recognitionRef.current = null
  }

  /*
   * ============================================
   * BẮT ĐẦU MICROPHONE
   * ============================================
   */

  const startListening = () => {
    /*
     * Lấy SpeechRecognition
     *
     * Chrome thường dùng:
     * webkitSpeechRecognition
     *
     * Một số browser dùng:
     * SpeechRecognition
     */
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition

    /*
     * Browser không hỗ trợ
     */
    if (!SpeechRecognition) {
      alert(
        'Trình duyệt không hỗ trợ nhập bằng giọng nói. Hãy dùng Google Chrome hoặc Microsoft Edge.',
      )

      return
    }

    /*
     * Nếu đang nghe thì không start lần nữa
     */
    if (isListeningRef.current) {
      return
    }

    /*
     * Tạo recognition mới
     */
    const recognition =
      new SpeechRecognition()

    /*
     * Ngôn ngữ tiếng Việt
     */
    recognition.lang = 'vi-VN'

    /*
     * Cho phép nói liên tục
     */
    recognition.continuous = true

    /*
     * Nhận cả kết quả tạm thời
     */
    recognition.interimResults = true

    /*
     * Chỉ lấy kết quả tốt nhất
     */
    recognition.maxAlternatives = 1

    /*
     * ------------------------------------------
     * RESET TEXT
     * ------------------------------------------
     */

    finalTextRef.current = ''

    interimTextRef.current = ''

    finishingRef.current = false

    /*
     * Lưu recognition
     */
    recognitionRef.current =
      recognition

    /*
     * Đánh dấu đang nghe
     */
    isListeningRef.current = true

    /*
     * Cập nhật UI
     */
    setIsListening(true)

    setRemainingTime(MAX_SECONDS)

    /*
     * ==========================================
     * ON START
     * ==========================================
     */

    recognition.onstart = () => {
      console.log(
        '🎤 Microphone bắt đầu nghe',
      )
    }

    /*
     * ==========================================
     * ON RESULT
     * ==========================================
     */

    recognition.onresult = (
      event,
    ) => {
      /*
       * Text đang nói
       */
      let interimText = ''

      /*
       * Duyệt qua các kết quả
       */
      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        const result =
          event.results[i]

        if (!result) continue

        const text =
          result[0]?.transcript ?? ''

        /*
         * Nếu browser đã xác nhận câu
         */
        if (result.isFinal) {
          finalTextRef.current +=
            text + ' '
        }

        /*
         * Nếu vẫn đang nhận dạng
         */
        else {
          interimText += text
        }
      }

      /*
       * Lưu phần đang nói
       */
      interimTextRef.current =
        interimText

      /*
       * Ghép toàn bộ text
       */
      const currentText =
        getCurrentText()

      /*
       * Cập nhật textarea realtime
       */
      if (
        currentText.length > 0
      ) {
        onResult(currentText)
      }
    }

    /*
     * ==========================================
     * ON ERROR
     * ==========================================
     */

    recognition.onerror = (
      event,
    ) => {
      console.error(
        'Speech Recognition Error:',
        event.error,
      )

      /*
       * Không có giọng nói
       *
       * Không cần tắt ngay.
       */
      if (
        event.error ===
        'no-speech'
      ) {
        return
      }

      /*
       * Người dùng chủ động stop
       */
      if (
        event.error ===
        'aborted'
      ) {
        return
      }

      /*
       * Các lỗi khác
       */
      finishListening()
    }

    /*
     * ==========================================
     * ON END
     * ==========================================
     */

    recognition.onend = () => {
      console.log(
        '🎤 Speech Recognition ended',
      )

      /*
       * Chrome đôi khi tự stop.
       *
       * Nếu chúng ta vẫn muốn nghe
       * thì start lại.
       */
      if (
        isListeningRef.current &&
        !finishingRef.current
      ) {
        try {
          recognition.start()

          console.log(
            '🎤 Speech Recognition restarted',
          )
        } catch {
          console.log(
            'Không thể restart recognition',
          )
        }
      }
    }

    /*
     * ==========================================
     * START MICROPHONE
     * ==========================================
     */

    try {
      recognition.start()
    } catch (error) {
      console.error(
        'Không thể bắt đầu microphone:',
        error,
      )

      isListeningRef.current =
        false

      setIsListening(false)

      return
    }

    /*
     * ==========================================
     * COUNTDOWN 10 GIÂY
     * ==========================================
     */

    let seconds = MAX_SECONDS

    timerRef.current =
      setInterval(() => {
        seconds -= 1

        /*
         * Không cho xuống âm
         */
        setRemainingTime(
          Math.max(
            seconds,
            0,
          ),
        )

        /*
         * Countdown hết
         */
        if (
          seconds <= 0
        ) {
          clearTimers()
        }
      }, 1000)

    /*
     * ==========================================
     * AUTO STOP SAU 10 GIÂY
     * ==========================================
     */

    timeoutRef.current =
      setTimeout(() => {
        console.log(
          '⏱️ Đã đủ 10 giây',
        )

        finishListening()
      }, MAX_RECORDING_TIME)
  }

  /*
   * ============================================
   * DỪNG MICROPHONE THỦ CÔNG
   * ============================================
   */

  const stopListening = () => {
    console.log(
      '🛑 Người dùng dừng microphone',
    )

    finishListening()
  }

  /*
   * ============================================
   * CLEANUP
   * ============================================
   */

  useEffect(() => {
    return () => {
      /*
       * Đánh dấu đã dừng
       */
      isListeningRef.current =
        false

      /*
       * Xóa timer
       */
      clearTimers()

      /*
       * Dừng microphone
       */
      try {
        recognitionRef.current?.stop()
      } catch {
        // ignore
      }

      recognitionRef.current =
        null
    }
  }, [])

  /*
   * ============================================
   * UI
   * ============================================
   */

  return (
    <button
      type="button"
      onClick={
        isListening
          ? stopListening
          : startListening
      }
      aria-label={
        isListening
          ? 'Dừng nhập bằng giọng nói'
          : 'Nhập bằng giọng nói'
      }
      title={
        isListening
          ? 'Dừng nhập bằng giọng nói'
          : 'Nhập bằng giọng nói'
      }
      className={`touch-target relative flex size-9 shrink-0 items-center justify-center rounded-md transition-colors ${
        isListening
          ? 'bg-red-500 text-white'
          : 'text-ink-muted hover:bg-surface-sunken'
      }`}
    >
      {isListening ? (
        <span className="text-xs font-semibold">
          {remainingTime}s
        </span>
      ) : (
        '🎤'
      )}
    </button>
  )
}