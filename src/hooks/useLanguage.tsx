import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

type Lang = 'en' | 'es'

interface LanguageContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string) => string
}

const translations: Record<string, Record<Lang, string>> = {
  // === CommandCenter ===
  'cc.header': { en: '// command center', es: '// centro de comando' },
  'cc.title': { en: 'Content Command Center', es: 'Centro de Comando de Contenido' },
  'cc.input': { en: 'Input', es: 'Entrada' },
  'cc.input.desc': { en: 'Raw content goes in, polished content comes out.', es: 'Entra contenido en bruto, sale contenido pulido.' },
  'cc.output': { en: 'Output', es: 'Salida' },
  'cc.output.desc': { en: 'Choose formats, attach media, then generate.', es: 'Elige formatos, adjunta medios, luego genera.' },
  'cc.logout': { en: 'Logout', es: 'Cerrar sesión' },
  'cc.generating': { en: 'Generating content...', es: 'Generando contenido...' },
  'cc.drafts': { en: 'Blog / Social Media Drafts', es: 'Borradores de Blog / Redes Sociales' },
  'cc.drafts.ready': { en: 'Your generated draft is below. Edit, copy, or publish.', es: 'Tu borrador generado está abajo. Edita, copia o publica.' },
  'cc.drafts.empty.desc': { en: 'Generated content will appear here as editable drafts.', es: 'El contenido generado aparecerá aquí como borradores editables.' },
  'cc.drafts.none': { en: 'No drafts yet. Generate content above to create your first draft.', es: 'Aún no hay borradores. Genera contenido arriba para crear tu primer borrador.' },
  'cc.history': { en: 'History', es: 'Historial' },
  'cc.history.desc': { en: 'Past generations. Click to expand.', es: 'Generaciones anteriores. Haz clic para expandir.' },

  // === AuthGate ===
  'auth.title': { en: 'Authentication Required', es: 'Autenticación Requerida' },
  'auth.desc': { en: 'Admin access only.', es: 'Solo acceso de administrador.' },
  'auth.email': { en: 'Email', es: 'Correo electrónico' },
  'auth.password': { en: 'Password', es: 'Contraseña' },
  'auth.loading': { en: 'Authenticating...', es: 'Autenticando...' },
  'auth.login': { en: 'Log In', es: 'Iniciar Sesión' },

  // === InputPanel ===
  'input.braindump': { en: 'Brain Dump', es: 'Lluvia de Ideas' },
  'input.youtube': { en: 'YouTube', es: 'YouTube' },
  'input.record': { en: 'Record', es: 'Grabar' },
  'input.resume': { en: 'Resume', es: 'Reanudar' },
  'input.pause': { en: 'Pause', es: 'Pausar' },
  'input.stop': { en: 'Stop', es: 'Detener' },
  'input.paused': { en: 'Paused', es: 'Pausado' },
  'input.voice.hint': { en: 'Type or speak — your brain dump, your way', es: 'Escribe o habla — tu lluvia de ideas, a tu manera' },
  'input.placeholder.recording': { en: 'Listening... speak into your microphone', es: 'Escuchando... habla en tu micrófono' },
  'input.placeholder': { en: 'Type your raw thoughts, notes, ideas... or hit Record to speak them. Claude will transform everything into polished content.', es: 'Escribe tus pensamientos, notas, ideas... o presiona Grabar para hablarlos. Claude transformará todo en contenido pulido.' },
  'input.newpara': { en: 'New ¶', es: 'Nuevo ¶' },
  'input.clear': { en: 'Clear', es: 'Limpiar' },
  'input.chars': { en: 'chars', es: 'caracteres' },
  'input.words': { en: 'words', es: 'palabras' },
  'input.translating': { en: 'Translating', es: 'Traduciendo' },

  // === OutputPanel ===
  'output.generate': { en: 'GENERATE CONTENT', es: 'GENERAR CONTENIDO' },
  'output.generating': { en: 'Generating...', es: 'Generando...' },
  'output.cascade.generating': { en: 'Researching & Generating...', es: 'Investigando y Generando...' },

  // === FormatSelector ===
  'format.label': { en: 'Format', es: 'Formato' },
  'format.all': { en: 'All', es: 'Todos' },
  'format.social': { en: 'Social Post', es: 'Post Social' },
  'format.social.desc': { en: 'Platform-ready caption', es: 'Caption listo para publicar' },
  'format.blog': { en: 'Blog Article', es: 'Artículo de Blog' },
  'format.blog.desc': { en: 'Full markdown article', es: 'Artículo completo en markdown' },
  'format.thread': { en: 'X Thread', es: 'Hilo de X' },
  'format.thread.desc': { en: 'Numbered tweet thread', es: 'Hilo de tweets numerado' },
  'format.video': { en: 'Image & Video Prompts', es: 'Prompts de Imagen y Video' },
  'format.video.desc': { en: 'AI-optimized prompts for any platform', es: 'Prompts optimizados para cualquier plataforma' },

  // === PlatformPicker ===
  'platform.label': { en: 'Platforms', es: 'Plataformas' },
  'platform.all': { en: 'All', es: 'Todas' },
  'platform.tiktok.desc': { en: 'Short-form video content', es: 'Contenido de video corto' },
  'platform.instagram.desc': { en: 'Posts, reels & carousels', es: 'Posts, reels y carruseles' },
  'platform.pinterest.desc': { en: 'Pins & SEO keywords', es: 'Pins y palabras clave SEO' },
  'platform.youtube.desc': { en: 'Ideas, scripts & thumbnails', es: 'Ideas, guiones y miniaturas' },
  'platform.linkedin.desc': { en: 'Professional posts', es: 'Posts profesionales' },
  'platform.cascade': { en: 'Cascade', es: 'Cascada' },
  'platform.cascade.tooltip': { en: 'Blog first with web research, then derive social posts from it. Uses cheaper model for derivatives — saves ~70% on API costs.', es: 'Blog primero con investigación web, luego deriva posts sociales. Usa modelo más económico para derivados — ahorra ~70% en costos de API.' },

  // === MediaInput ===
  'media.label': { en: 'Images & Media', es: 'Imágenes y Medios' },
  'media.drop': { en: 'Drop files here', es: 'Suelta archivos aquí' },
  'media.drag': { en: 'Drag & drop photos or videos here', es: 'Arrastra y suelta fotos o videos aquí' },
  'media.browse': { en: 'or click to browse', es: 'o haz clic para buscar' },
  'media.paste': { en: 'Ctrl+V to paste', es: 'Ctrl+V para pegar' },
  'media.url.placeholder': { en: 'YouTube or social media URL...', es: 'URL de YouTube o redes sociales...' },
  'media.add': { en: 'Add', es: 'Agregar' },

  // === YouTubeInput ===
  'yt.label': { en: 'YouTube URL', es: 'URL de YouTube' },
  'yt.extracting': { en: 'Extracting...', es: 'Extrayendo...' },
  'yt.extract': { en: 'Extract', es: 'Extraer' },
  'yt.error': { en: 'Failed to extract transcript. Make sure the video has captions.', es: 'Error al extraer la transcripción. Asegúrate de que el video tenga subtítulos.' },
  'yt.transcript': { en: 'Transcript', es: 'Transcripción' },

  // === BlogClarifyForm ===
  'clarify.title': { en: 'Quick context for a better article', es: 'Contexto rápido para un mejor artículo' },
  'clarify.tools': { en: 'What tools/gear did you actually use?', es: '¿Qué herramientas usaste realmente?' },
  'clarify.tools.placeholder': { en: 'e.g. Cursor, Claude Code, Vercel, Supabase...', es: 'ej. Cursor, Claude Code, Vercel, Supabase...' },
  'clarify.details': { en: 'What specifically happened — any details to add?', es: '¿Qué pasó específicamente — algún detalle para agregar?' },
  'clarify.details.placeholder': { en: 'Specific results, timelines, problems you hit, metrics...', es: 'Resultados específicos, plazos, problemas que encontraste, métricas...' },
  'clarify.affiliate': { en: 'Affiliate links (product name + URL)', es: 'Enlaces de afiliados (nombre del producto + URL)' },
  'clarify.addanother': { en: '+ Add another', es: '+ Agregar otro' },
  'clarify.product': { en: 'Product name', es: 'Nombre del producto' },

  // === GeneratedContentTabs ===
  'gen.title': { en: 'Generated Content', es: 'Contenido Generado' },
  'gen.editing': { en: 'Editing — click into the draft to make changes', es: 'Editando — haz clic en el borrador para hacer cambios' },
  'gen.edit': { en: 'Edit', es: 'Editar' },
  'gen.save': { en: 'Save', es: 'Guardar' },
  'gen.saved': { en: 'Saved!', es: '¡Guardado!' },
  'gen.cancel': { en: 'Cancel', es: 'Cancelar' },
  'gen.copy': { en: 'Copy', es: 'Copiar' },
  'gen.copied': { en: 'Copied!', es: '¡Copiado!' },
  'gen.publish': { en: 'Publish', es: 'Publicar' },
  'gen.postx': { en: 'Post to X', es: 'Publicar en X' },

  // === SiteSettings ===
  'settings.site': { en: 'Site Controls', es: 'Controles del Sitio' },
  'settings.contact': { en: 'Contact Form', es: 'Formulario de Contacto' },
  'settings.contact.on': { en: 'Accepting inquiries', es: 'Aceptando consultas' },
  'settings.contact.off': { en: 'Showing "Coming Soon"', es: 'Mostrando "Próximamente"' },
  'settings.generation': { en: 'Generation', es: 'Generación' },
  'settings.perplexity': { en: 'Perplexity Hashtags', es: 'Hashtags de Perplexity' },
  'settings.perplexity.on': { en: 'Researching trending hashtags via Perplexity', es: 'Investigando hashtags en tendencia vía Perplexity' },
  'settings.perplexity.off': { en: 'Claude generates hashtags on its own', es: 'Claude genera hashtags por su cuenta' },
  'settings.platforms': { en: 'Platforms', es: 'Plataformas' },
  'settings.youtube.on': { en: 'Content ideas & scripts', es: 'Ideas de contenido y guiones' },
  'settings.youtube.off': { en: 'YouTube hidden from platforms', es: 'YouTube oculto de plataformas' },
  'settings.linkedin.on': { en: 'LinkedIn posts enabled', es: 'Posts de LinkedIn activado' },
  'settings.linkedin.off': { en: 'LinkedIn hidden from platforms', es: 'LinkedIn oculto de plataformas' },
  'settings.language': { en: 'Language', es: 'Idioma' },
  'settings.lang.label': { en: 'Page Language', es: 'Idioma de Página' },
  'settings.lang.en': { en: 'English', es: 'Inglés' },
  'settings.lang.es': { en: 'Spanish', es: 'Español' },

  // === ContentHistory ===
  'history.empty': { en: 'No content generated yet. Create your first piece above.', es: 'Aún no se ha generado contenido. Crea tu primera pieza arriba.' },
  'history.copy': { en: 'Copy', es: 'Copiar' },
  'history.copied': { en: 'Copied!', es: '¡Copiado!' },
  'history.selectall': { en: 'Select All', es: 'Seleccionar Todo' },
  'history.deselectall': { en: 'Deselect All', es: 'Deseleccionar Todo' },
  'history.selected': { en: 'selected', es: 'seleccionados' },
  'history.delete': { en: 'Delete', es: 'Eliminar' },
  'history.deleting': { en: 'Deleting...', es: 'Eliminando...' },

  // === BlogPostEditor ===
  'editor.title': { en: 'Publish Blog Post', es: 'Publicar Artículo de Blog' },
  'editor.required': { en: 'Title and content are required', es: 'El título y el contenido son obligatorios' },

  // === Guided Tour ===
  'tour.skip': { en: 'Skip tour', es: 'Saltar tour' },
  'tour.prev': { en: 'Back', es: 'Atrás' },
  'tour.next': { en: 'Next', es: 'Siguiente' },
  'tour.done': { en: 'Got it!', es: '¡Entendido!' },
  'tour.input.title': { en: 'Brain Dump & Input', es: 'Lluvia de Ideas y Entrada' },
  'tour.input.body': {
    en: 'This is where your raw content goes. Type your thoughts, paste notes, or hit Record to speak directly. You can also pull in a YouTube transcript. Don\'t worry about polish — Claude will handle that.',
    es: 'Aquí va tu contenido en bruto. Escribe tus pensamientos, pega notas, o presiona Grabar para hablar directamente. También puedes importar una transcripción de YouTube. No te preocupes por pulir — Claude se encargará de eso.',
  },
  'tour.output.title': { en: 'Formats & Platforms', es: 'Formatos y Plataformas' },
  'tour.output.body': {
    en: 'Choose what you want to create: social posts, blog articles, X threads, or video prompts. Then pick which platforms to target. Select multiple formats and platforms to generate everything at once.',
    es: 'Elige qué quieres crear: posts sociales, artículos de blog, hilos de X, o prompts de video. Luego selecciona las plataformas. Puedes seleccionar múltiples formatos y plataformas para generar todo a la vez.',
  },
  'tour.generate.title': { en: 'Generate Content', es: 'Generar Contenido' },
  'tour.generate.body': {
    en: 'Hit this button to generate your content. If you selected Blog + social formats with Cascade enabled, it\'ll research and write the blog first, then derive all social posts from it — saving cost and keeping everything consistent.',
    es: 'Presiona este botón para generar tu contenido. Si seleccionaste Blog + formatos sociales con Cascada activada, investigará y escribirá el blog primero, luego derivará todos los posts sociales — ahorrando costos y manteniendo consistencia.',
  },
  'tour.drafts.title': { en: 'Your Drafts', es: 'Tus Borradores' },
  'tour.drafts.body': {
    en: 'Generated content appears here in tabs — one per format. You can edit the blog draft directly by clicking into it, copy social posts, or publish the blog to your site. Each platform\'s content is formatted specifically for that platform.',
    es: 'El contenido generado aparece aquí en pestañas — una por formato. Puedes editar el borrador del blog directamente haciendo clic en él, copiar posts sociales, o publicar el blog en tu sitio. El contenido de cada plataforma está formateado específicamente para ella.',
  },
  'tour.history.title': { en: 'Generation History', es: 'Historial de Generación' },
  'tour.history.body': {
    en: 'Every generation is saved here. You can expand any past generation to review it, select multiple to copy or delete, and track your daily usage. Your history is searchable and sortable.',
    es: 'Cada generación se guarda aquí. Puedes expandir cualquier generación anterior para revisarla, seleccionar varias para copiar o eliminar, y rastrear tu uso diario.',
  },
  'tour.settings.title': { en: 'Settings & Controls', es: 'Configuración y Controles' },
  'tour.settings.body': {
    en: 'Click the gear icon to access settings: toggle Perplexity for AI-powered hashtag research, switch between YouTube and LinkedIn as your 4th platform, and change the page language between English and Spanish.',
    es: 'Haz clic en el icono de engranaje para acceder a la configuración: activa Perplexity para investigación de hashtags con IA, cambia entre YouTube y LinkedIn como tu 4ta plataforma, y cambia el idioma de la página entre inglés y español.',
  },

  // === Status messages ===
  'status.hashtags': { en: 'Researching trending hashtags...', es: 'Investigando hashtags en tendencia...' },
  'status.generating': { en: 'Generating content...', es: 'Generando contenido...' },
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (key: string) => key,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      return (localStorage.getItem('cc_lang') as Lang) || 'en'
    } catch {
      return 'en'
    }
  })

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang)
    try { localStorage.setItem('cc_lang', newLang) } catch {}
  }, [])

  const t = useCallback((key: string): string => {
    return translations[key]?.[lang] || translations[key]?.en || key
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
