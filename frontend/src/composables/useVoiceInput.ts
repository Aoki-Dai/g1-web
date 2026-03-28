import { ref, computed, onUnmounted } from 'vue'

// Web Speech API の型定義（TypeScript標準には含まれない）
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

export type VoiceInputStatus = 'idle' | 'listening' | 'processing' | 'unsupported'

export function useVoiceInput(onResult: (text: string) => void) {
  const status = ref<VoiceInputStatus>('idle')
  const transcript = ref('')
  const interimTranscript = ref('')

  const isSupported = computed(() => {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  })

  let recognition: SpeechRecognition | null = null

  function createRecognition(): SpeechRecognition | null {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      status.value = 'unsupported'
      return null
    }

    const rec = new SR()
    rec.continuous = false
    rec.interimResults = true
    rec.lang = 'ja-JP'

    rec.onstart = () => {
      status.value = 'listening'
      transcript.value = ''
      interimTranscript.value = ''
    }

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      let final = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          final += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }

      if (final) {
        transcript.value = final
        interimTranscript.value = ''
      } else {
        interimTranscript.value = interim
      }
    }

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      // 'aborted' はユーザー操作による停止なのでエラーとして扱わない
      if (event.error !== 'aborted') {
        console.warn('Speech recognition error:', event.error)
      }
      status.value = 'idle'
    }

    rec.onend = () => {
      // 最終結果があればコールバックを呼ぶ
      if (transcript.value) {
        status.value = 'processing'
        onResult(transcript.value)
      } else if (interimTranscript.value) {
        // interim しか残っていない場合もそれを使う
        transcript.value = interimTranscript.value
        interimTranscript.value = ''
        status.value = 'processing'
        onResult(transcript.value)
      } else {
        status.value = 'idle'
      }
    }

    return rec
  }

  function startListening() {
    if (status.value === 'listening') {
      stopListening()
      return
    }
    recognition = createRecognition()
    if (recognition) {
      recognition.start()
    }
  }

  function stopListening() {
    recognition?.stop()
  }

  function resetStatus() {
    status.value = 'idle'
  }

  onUnmounted(() => {
    recognition?.abort()
  })

  return {
    status,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    resetStatus,
  }
}
