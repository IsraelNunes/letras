// Mapeamento estático de vídeos de dica por tipo de atividade.
//
// Os vídeos .mov originais (35–115 MB cada) precisam ser transcodificados
// para MP4 H.264 (~720p, ~2–5 MB cada) antes de hospedar.
// Substitua os valores de URL abaixo pelo endereço final após o upload.
//
// Conteúdo de cada clipe (baseado nas transcrições de junho/2026):
//   img-6872 — Introdução à plataforma Letras (20s)
//   img-6873 — As 3 etapas do processo de alfabetização (25s)
//   img-6874 — Aplicar atividade com o alfabetizando e avançar (20s)
//   img-6875 — Etapa 2: alfabetizando aprende a usar o celular (19s)
//   img-6876 — Sistema de formas e cores para navegar (14s)
//   img-6877 — Após dominar formas e cores, volta à alfabetização (8s)
//   img-6879 — Papel do alfabetizador na Etapa 2 (10s)
//   img-6881 — É o alfabetizando quem deve mexer no celular (15s)
//   img-6882 — Etapa 3: alfabetizando sozinho (14s)
//   img-6884 — "Parece complicado, mas não é" (8s)
//   img-6890 — Assista todos os tutoriais antes de começar (15s)
//   img-6895 — CTA: "Pronto para começar? Então vamos!" (11s)
//   img-6896 — CTA: "Vamos juntos!" (11s)
//   letras-01 — Overview completo de 2min20 (fallback)

const BASE_URL = process.env.EXPO_PUBLIC_HINT_VIDEOS_BASE_URL ?? '';

export const HINT_VIDEOS = {
  // Clipes curtos por tema
  intro: `${BASE_URL}/img-6872.mp4`,
  tresetapas: `${BASE_URL}/img-6873.mp4`,
  aplicarAtividade: `${BASE_URL}/img-6874.mp4`,
  etapa2: `${BASE_URL}/img-6875.mp4`,
  formasCores: `${BASE_URL}/img-6876.mp4`,
  aposFormasCores: `${BASE_URL}/img-6877.mp4`,
  papelAlfabetizador: `${BASE_URL}/img-6879.mp4`,
  alfabetizandoUsaCelular: `${BASE_URL}/img-6881.mp4`,
  etapa3: `${BASE_URL}/img-6882.mp4`,
  simples: `${BASE_URL}/img-6884.mp4`,
  assistaTutoriais: `${BASE_URL}/img-6890.mp4`,
  ctaVamos: `${BASE_URL}/img-6895.mp4`,
  ctaVamosJuntos: `${BASE_URL}/img-6896.mp4`,
  // Vídeo completo — fallback
  full: `${BASE_URL}/letras-01.mp4`,
} as const;

// Retorna a URL da dica mais relevante para um dado screenTemplate.
// Retorna null se BASE_URL não estiver configurada (sem dica configurada).
export function getHintVideoForTemplate(
  screenTemplate: string | null | undefined,
): string | null {
  if (!BASE_URL) return null;

  switch (screenTemplate) {
    // Exercício de marcar imagens — ensinando navegação por formas e cores
    case 'exercise-mark-images':
      return HINT_VIDEOS.formasCores;

    // Exercício de completar letras — uso do celular pelo alfabetizando
    case 'exercise-match-letter':
      return HINT_VIDEOS.alfabetizandoUsaCelular;

    // Tela padrão (conteúdo/mídia) — como aplicar a atividade
    case 'default':
      return HINT_VIDEOS.aplicarAtividade;

    // Fallback para qualquer outro template
    default:
      return HINT_VIDEOS.full;
  }
}
