import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import dotenv from 'dotenv'
import { buildRealtimeInstructions } from './src/realtimeInstructions.ts'
import { getPersona } from './src/personas.ts'

dotenv.config()

function elevenLabsTtsProxy(): Plugin {
  return {
    name: 'elevenlabs-tts-proxy',
    configureServer(server) {
      server.middlewares.use('/api/tts', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }

        const apiKey = process.env.ELEVENLABS_API_KEY
        const voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'

        if (!apiKey) {
          res.statusCode = 501
          res.end('ELEVENLABS_API_KEY not configured')
          return
        }

        try {
          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(chunk as Buffer)
          const { text } = JSON.parse(Buffer.concat(chunks).toString('utf-8') || '{}')

          if (!text || typeof text !== 'string') {
            res.statusCode = 400
            res.end('Missing text')
            return
          }

          const upstream = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
            {
              method: 'POST',
              headers: {
                'xi-api-key': apiKey,
                'Content-Type': 'application/json',
                Accept: 'audio/mpeg',
              },
              body: JSON.stringify({
                text,
                model_id: 'eleven_multilingual_v2',
                voice_settings: { stability: 0.45, similarity_boost: 0.8 },
              }),
            },
          )

          if (!upstream.ok || !upstream.body) {
            res.statusCode = upstream.status
            res.end(await upstream.text())
            return
          }

          res.statusCode = 200
          res.setHeader('Content-Type', 'audio/mpeg')
          const reader = upstream.body.getReader()
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            res.write(value)
          }
          res.end()
        } catch (err) {
          res.statusCode = 500
          res.end(err instanceof Error ? err.message : 'TTS proxy error')
        }
      })
    },
  }
}

function openAiRealtimeSessionProxy(): Plugin {
  return {
    name: 'openai-realtime-session-proxy',
    configureServer(server) {
      server.middlewares.use('/api/realtime-session', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }

        const apiKey = process.env.OPENAI_API_KEY
        const model = process.env.REALTIME_MODEL || 'gpt-4o-realtime-preview-2024-12-17'

        if (!apiKey) {
          res.statusCode = 501
          res.end('OPENAI_API_KEY not configured')
          return
        }

        try {
          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(chunk as Buffer)
          const body = JSON.parse(Buffer.concat(chunks).toString('utf-8') || '{}')
          const interests = Array.isArray(body.interests) ? body.interests : []
          const plan = typeof body.plan === 'string' ? body.plan : ''
          const persona = getPersona(typeof body.personaId === 'string' ? body.personaId : undefined)
          const voice = persona.voice || process.env.REALTIME_VOICE || 'verse'

          const instructions = buildRealtimeInstructions({ interests, plan, personaId: persona.id }, persona)

          const upstream = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              session: {
                type: 'realtime',
                model,
                instructions,
                audio: {
                  output: { voice },
                  input: {
                    transcription: { model: 'whisper-1' },
                    turn_detection: {
                      type: 'server_vad',
                      silence_duration_ms: 700,
                      // Off: without headphones, mic pickup of the AI's own
                      // voice (imperfect echo cancellation) was tripping VAD
                      // and self-interrupting the AI mid-sentence, which fed
                      // into a runaway response loop.
                      interrupt_response: false,
                      // The client re-injects a tone reminder and triggers the
                      // response itself (see useRealtimeCall.ts), so auto-response
                      // must stay off to avoid firing twice.
                      create_response: false,
                    },
                  },
                },
              },
            }),
          })

          if (!upstream.ok) {
            res.statusCode = upstream.status
            res.end(await upstream.text())
            return
          }

          const data = (await upstream.json()) as { value?: string }
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              client_secret: data.value,
              model,
            }),
          )
        } catch (err) {
          res.statusCode = 500
          res.end(err instanceof Error ? err.message : 'realtime session proxy error')
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), elevenLabsTtsProxy(), openAiRealtimeSessionProxy()],
})
