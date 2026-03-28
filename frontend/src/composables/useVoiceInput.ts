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
  onaudiostart: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

export type VoiceInputStatus = 'idle' | 'listening' | 'processing' | 'unsupported'

// 最終結果を得てから自動停止するまでの猶予(ms)
const FINAL_RESULT_DELAY = 800
// 最大リスニング時間(ms) — 長すぎると音声APIの制限に引っかかる
const MAX_LISTEN_DURATION = 30_000

export function useVoiceInput(onResult: (text: string) => void) {
  const status = ref<VoiceInputStatus>('idle')
  const transcript = ref('')
  const interimTranscript = ref('')

  const isSupported = computed(() => {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  })

  let recognition: SpeechRecognition | null = null
  let finalResultTimer: ReturnType<typeof setTimeout> | null = null
  let maxDurationTimer: ReturnType<typeof setTimeout> | null = null
  // onend で自動再起動するかどうかのフラグ
  let shouldRestart = false
  // ユーザーが意図��に停止したかどうか
  let userStopped = false
  // final result を受け取り済みかどうか
  let hasFinalResult = false

  function clearTimers() {
    if (finalResultTimer) {
      clearTimeout(finalResultTimer)
      finalResultTimer = null
    }
    if (maxDurationTimer) {
      clearTimeout(maxDurationTimer)
      maxDurationTimer = null
    }
  }

  function createRecognition(): SpeechRecognition | null {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      status.value = 'unsupported'
      return null
    }

    const rec = new SR()
    // continuous: true にすることで、ブラウザが勝手に止めなくなる
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'ja-JP'

    rec.onstart = () => {
      status.value = 'listening'
    }

    rec.onaudiostart = () => {
      // マイクが実際に音を拾い始めた = 確実にリスニング中
      status.value = 'listening'
    }

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      let final = ''

      // 全結果を走査して final と interim を集める
      for (let i = 0; i < event.results.length; i++) {
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
        hasFinalResult = true

        // final result を得たら少し待って自動停止
        // （ユーザーが続けて話すかもしれないので猶予を持たせる）
        clearTimers()
        finalResultTimer = setTimeout(() => {
          finishListening()
        }, FINAL_RESULT_DELAY)
      } else if (interim) {
        interimTranscript.value = interim
        // interim が来ている = まだ話し中なので、final timer をリセット
        if (finalResultTimer) {
          clearTimeout(finalResultTimer)
          finalResultTimer = null
        }
      }
    }

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.warn('Speech recognition error:', event.error)

      if (event.error === 'no-speech') {
        // 何も聞こえなかった → continuous なので自動で再試行させる
        // onend が発火するので、そこで再起動する
        shouldRestart = true
        return
      }

      if (event.error === 'aborted' || event.error === 'network') {
        // ユーザー操作 or ネットワークエラー → 停止
        shouldRestart = false
        return
      }

      // その他のエラー → 停止
      shouldRestart = false
    }

    rec.onend = () => {
      // ユーザーが意図的に停止した場合
      if (userStopped) {
        deliverResult()
        return
      }

      // final result を取得済みならそれを送信
      if (hasFinalResult) {
        deliverResult()
        return
      }

      // no-speech 等で再起動が必要な場合
      if (shouldRestart && status.value === 'listening') {
        shouldRestart = false
        try {
          rec.start()
        } catch {
          // 再起動に失敗したら停止
          deliverResult()
        }
        return
      }

      // どれにも該当しない → 停止
      deliverResult()
    }

    return rec
  }

  /** 認識結果があればコールバックに渡し、なければ idle に戻す */
  function deliverResult() {
    clearTimers()

    const finalText = transcript.value || interimTranscript.value
    if (finalText) {
      transcript.value = finalText
      interimTranscript.value = ''
      status.value = 'processing'
      onResult(finalText)
    } else {
      status.value = 'idle'
    }
  }

  /** ユーザー操作またはタイマーで認識を終了する */
  function finishListening() {
    clearTimers()
    userStopped = true
    recognition?.stop()
  }

  function startListening() {
    // リスニング中にもう一度タップ → 停止して結果を送信
    if (status.value === 'listening') {
      finishListening()
      return
    }

    // processing 中は無視
    if (status.value === 'processing') return

    // 状態リセット
    transcript.value = ''
    interimTranscript.value = ''
    userStopped = false
    shouldRestart = false
    hasFinalResult = false
    clearTimers()

    recognition = createRecognition()
    if (recognition) {
      try {
        recognition.start()
        // 最大リスニング時間の安全弁
        maxDurationTimer = setTimeout(() => {
          finishListening()
        }, MAX_LISTEN_DURATION)
      } catch (e) {
        console.warn('Failed to start recognition:', e)
        status.value = 'idle'
      }
    }
  }

  function stopListening() {
    finishListening()
  }

  function resetStatus() {
    status.value = 'idle'
    transcript.value = ''
    interimTranscript.value = ''
  }

  onUnmounted(() => {
    clearTimers()
    userStopped = true
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
