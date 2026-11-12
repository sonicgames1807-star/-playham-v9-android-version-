import { useEffect, useRef, useState } from 'react'
import { loadBuiltins } from './builtins'
import { memeTemplates } from './memes'
import { readStorage, writeStorage } from './storage'
import Cropper from 'react-easy-crop'
import {
  Aperture, ArrowLeft, Camera, Check, ChevronRight, Crop, Eye,
  FlipHorizontal2, Grid3X3, HelpCircle, Home, ImagePlus, Lock, Menu, Moon,
  Move, Plus, RotateCcw, RotateCw, Save, Settings, Share2,
  Sparkles, Sun, Unlock, Upload, X, ZoomIn
} from 'lucide-react'

const onboarding = [
  { title: 'Подготовь место', text: 'Поставь телефон над листом или планшетом. Экран станет аккуратной визуальной подложкой.', icon: Aperture, art: 'stand' },
  { title: 'Добавь рисунок', text: 'Выбери изображение из галереи или сделай фотографию прямо сейчас.', icon: ImagePlus, art: 'image' },
  { title: 'Настрой видимость', text: 'Проведи по неоновой дорожке: от едва заметных контуров до чёткой картинки.', icon: Eye, art: 'opacity' },
  { title: 'Размести и рисуй', text: 'Двигай одним пальцем, масштабируй и поворачивай двумя. Затем зафиксируй рисунок.', icon: Move, art: 'gesture' },
  { title: 'Выбери шаблон', text: 'Не знаешь, что нарисовать? Открой шаблоны на главном экране и выбери рисунок по душе.', icon: Sparkles, art: 'image' }
]

const starterProjects = []
const IconButton = ({ label, children, active, ...props }) => <button className={`icon-button ${active ? 'active' : ''}`} aria-label={label} aria-pressed={active} {...props}>{children}</button>

function Logo() {
  return <div className="brand"><span className="brand-mark"><Sparkles size={17} aria-hidden="true" /></span><span>Trace Neon</span></div>
}

function Onboarding({ onDone }) {
  const [step, setStep] = useState(0)
  const item = onboarding[step]
  const ArtIcon = item.icon
  return <main id="main" className="onboarding page-enter">
    <header className="onboarding-head"><Logo /><button className="text-button" onClick={onDone}>Пропустить</button></header>
    <section className="onboarding-body" aria-live="polite">
      <div className={`lesson-art ${item.art}`}>
        <div className="lesson-orbit" />
        <div className="phone-demo"><div className="demo-screen"><ArtIcon size={54} strokeWidth={1.3} aria-hidden="true" /></div></div>
        <div className="paper-demo"><span /><span /><span /></div>
      </div>
      <div className="step-copy"><span className="step-count">{step + 1} из {onboarding.length}</span><h1>{item.title}</h1><p>{item.text}</p></div>
    </section>
    <footer className="onboarding-footer">
      <div className="dots" aria-label={`Шаг ${step + 1} из ${onboarding.length}`}>{onboarding.map((_, i) => <span key={i} className={i === step ? 'current' : ''} />)}</div>
      <button className="primary-button" onClick={() => step === onboarding.length - 1 ? onDone() : setStep(step + 1)}>{step === onboarding.length - 1 ? 'Начать' : 'Далее'}<ChevronRight size={20} aria-hidden="true" /></button>
    </footer>
  </main>
}

function Splash({ onDone }) {
  useEffect(() => { const timer = window.setTimeout(onDone, 1800); return () => window.clearTimeout(timer) }, [onDone])
  return <main className="splash-screen" aria-label="Trace Neon"><button className="splash-skip" onClick={onDone}>Пропустить</button><div className="splash-scene" aria-hidden="true"><div className="splash-aura"/><div className="splash-phone"><div className="splash-lens"/><svg viewBox="0 0 160 160"><path d="M26 112c28-3 28-62 56-62s28 58 52 56"/><path d="M33 126h94"/></svg></div><div className="splash-paper"/></div><div className="splash-brand"><span className="splash-logo"><Sparkles size={19}/></span><strong>Trace Neon</strong><small>Рисуй по своему</small></div><div className="splash-progress"><i/></div></main>
}

function EmptyArtwork() {
  return <div className="empty-art" aria-hidden="true"><div className="empty-glow"/><div className="mini-phone"><div className="mini-drawing"><Sparkles size={28}/></div></div><div className="mini-paper"><i/><i/><i/></div></div>
}

function ProjectThumb({ type }) {
  return <div className={`project-thumb ${type}`} aria-hidden="true"><svg viewBox="0 0 120 100"><path d={type === 'leaf' ? 'M65 88C34 68 33 27 91 14c4 37-3 66-26 74Zm0 0c3-28 10-46 26-74M59 65 39 51m28-4 18-13' : 'M42 86c0-16 8-20 17-23-10-9-15-25-8-38 9-17 38-14 43 7 3 14-5 24-14 31 10 4 17 10 20 23M53 38c12 2 24-2 31-10M63 47h1m17 0h1M69 57c4 3 9 3 13 0'} /></svg></div>
}

function TemplateLibrary({ onSelect }) {
  const [category, setCategory] = useState('Все')
  const [error, setError] = useState('')
  const [builtins, setBuiltins] = useState([])
  useEffect(() => { let active = true; loadBuiltins().then(items => { if (active) setBuiltins(items) }).catch(() => { if (active) setError('Не удалось загрузить готовые шаблоны. Обнови страницу.') }); return () => { active = false } }, [])
  const [templates, setTemplates] = useState(() => { try { return JSON.parse(readStorage('trace-templates')) || [] } catch { return [] } })
  async function addTemplate(event) {
    const file = event.target.files?.[0]
    if (!file) return
    event.target.value = ''
    const url = URL.createObjectURL(file)
    try {
      const image = new Image(); image.src = url; await image.decode()
      const canvas = document.createElement('canvas')
      const scale = Math.min(1, 1200 / Math.max(image.width, image.height))
      canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale)
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
      const next = [...templates, { id: crypto.randomUUID(), name: file.name.replace(/\.[^.]+$/, ''), source: canvas.toDataURL('image/webp', .85) }]
      if (!writeStorage('trace-templates', JSON.stringify(next))) throw new Error('storage full')
      setTemplates(next); setError('')
    } catch { setError('Не удалось добавить шаблон. Выбери JPG, PNG или WebP меньшего размера.') }
    finally { URL.revokeObjectURL(url) }
  }
  const all = [...memeTemplates, ...builtins, ...templates.map(template => ({ ...template, category: 'Мои' }))]
  const shown = all.filter(template => category === 'Все' || (category === 'Мемы' ? template.category === 'Мемы' : category === 'Мои' ? template.category === 'Мои' : template.category !== 'Мемы' && template.category !== 'Мои'))
  return <section className="template-library"><h2>Шаблоны для срисовки</h2><p>Выбери рисунок — он откроется целиком поверх камеры.</p><label className="secondary-button">Добавить шаблон<input type="file" accept="image/png,image/jpeg,image/webp" onChange={addTemplate} className="template-input" /></label><div className="template-filters">{['Все','Эскизы','Мемы','Мои'].map(item => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div>{error && <p role="alert">{error}</p>}<div className="template-list">{shown.map(template => <button key={template.id} className="template-card" onClick={() => onSelect(template)}><img loading="lazy" src={template.source} alt={template.name}/><strong>{template.name}</strong><span>Использовать с камерой</span></button>)}</div></section>
}

function HomeScreen({ projects, onPick, onNew, onOpenProject, onHelp, onSettings }) {
  return <main id="main" className="home-screen page-enter">
    <header className="topbar"><Logo /><IconButton label="Открыть настройки" onClick={onSettings}><Settings size={21}/></IconButton></header>
    <section className="hero-copy"><p className="hello">Твоя мастерская</p><h1>Что будем<br/>рисовать?</h1></section>
    <section className="add-card">
      <EmptyArtwork />
      <div className="add-copy"><h2>Добавь изображение</h2><p>Контуры появятся на рабочем экране</p></div>
      <div className="add-actions">
        <button className="primary-button" onClick={() => onPick('gallery')}><Upload size={20}/>Из галереи</button>
        <button className="secondary-button" onClick={() => onPick('camera')}><Camera size={20}/>Сделать фото</button>
      </div>
    </section>
    <button className="catalog-banner" onClick={onHelp}><HelpCircle size={25}/><span><strong>Обучение</strong><small>Камера, шаблоны и срисовка — 5 шагов</small></span><ChevronRight size={20}/></button>
    <TemplateLibrary onSelect={onOpenProject}/>
    <section className="recent-section">
      <div className="section-heading"><h2>Недавние</h2></div>
      <div className="project-list">{projects.length ? projects.map(project => <button className="project-row" key={project.id} onClick={() => onOpenProject(project)}>{project.source ? <img className="project-source-thumb" src={project.source} alt=""/> : <ProjectThumb type={project.thumb}/>}<span className="project-meta"><strong>{project.name}</strong><small>{project.date}</small></span><ChevronRight size={20}/></button>) : <p className="empty-projects">Здесь появятся сохранённые рисунки.</p>}</div>
    </section>
    <button className="how-link" onClick={onHelp}><HelpCircle size={19}/>Как это работает?</button>
    <BottomNav current="home" onHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })} onNew={onNew} onSettings={onSettings} />
  </main>
}

function BottomNav({ current, onHome, onNew, onSettings }) {
  return <nav className="bottom-nav" aria-label="Основная навигация"><button onClick={onHome} className={current === 'home' ? 'active' : ''}><Home size={21}/><span>Главная</span></button><button onClick={onNew}><Plus size={23}/><span>Новый</span></button><button onClick={onSettings}><Settings size={21}/><span>Настройки</span></button></nav>
}

function AddSheet({ onClose, onPick }) {
  return <div className="modal-layer"><button className="scrim" aria-label="Закрыть меню" onClick={onClose}/><section className="sheet page-up" role="dialog" aria-modal="true" aria-labelledby="add-title"><div className="sheet-handle"/><div className="sheet-title"><div><h2 id="add-title">Добавить рисунок</h2><p>Выбери источник изображения</p></div><IconButton label="Закрыть" onClick={onClose}><X size={21}/></IconButton></div><div className="source-list"><button onClick={() => onPick('gallery')}><span className="source-icon"><ImagePlus/></span><span><strong>Выбрать из галереи</strong><small>JPG, PNG или WebP</small></span><ChevronRight/></button><button onClick={() => onPick('camera')}><span className="source-icon violet"><Camera/></span><span><strong>Сделать фото</strong><small>Откроется камера телефона</small></span><ChevronRight/></button></div><p className="privacy-note">Изображения остаются только на твоём устройстве.</p></section></div>
}

function Toast({ children }) { return <div className="toast" role="status"><Check size={18}/>{children}</div> }

function Workspace({ source, project, onBack, onSave, onReplace }) {
  const videoRef = useRef(null)
  const [cameraState, setCameraState] = useState('loading')
  const [opacity, setOpacity] = useState(project?.opacity ?? 58)
  const [locked, setLocked] = useState(project?.locked ?? false)
  const [grid, setGrid] = useState(project?.grid ?? false)
  const [tools, setTools] = useState(false)
  const [toast, setToast] = useState('')
  const [transform, setTransform] = useState(project?.transform ?? { x: 0, y: 0, scale: 1, rotate: 0, flip: 1 })
  const pointers = useRef(new Map())
  const gesture = useRef(null)

  useEffect(() => {
    let stream
    let cancelled = false
    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) { setCameraState('unsupported'); return }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' } } })
        if (cancelled) { stream.getTracks().forEach(track => track.stop()); return }
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        setCameraState('ready')
      } catch (error) {
        if (!cancelled) setCameraState(error.name === 'NotAllowedError' ? 'denied' : 'unavailable')
      }
    }
    startCamera()
    return () => { cancelled = true; stream?.getTracks().forEach(track => track.stop()) }
  }, [])

  const flash = text => { setToast(text); window.setTimeout(() => setToast(''), 2200) }
  const reset = () => { setTransform({ x: 0, y: 0, scale: 1, rotate: 0, flip: 1 }); flash('Положение сброшено') }
  const save = () => { onSave({ name: project?.name || 'Новый рисунок', opacity, thumb: project?.thumb || 'leaf', transform, grid, locked }); flash('Проект сохранён') }

  const pointerDown = e => {
    if (locked) return
    e.currentTarget.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const pts = [...pointers.current.values()]
    gesture.current = pts.length === 1 ? { type: 'move', start: pts[0], base: transform } : { type: 'pinch', distance: Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y), angle: Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x), base: transform }
  }
  const pointerMove = e => {
    if (locked || !pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const pts = [...pointers.current.values()]
    if (pts.length === 1 && gesture.current?.type === 'move') setTransform(t => ({ ...t, x: gesture.current.base.x + pts[0].x - gesture.current.start.x, y: gesture.current.base.y + pts[0].y - gesture.current.start.y }))
    if (pts.length >= 2 && gesture.current?.type === 'pinch') {
      const distance = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y)
      const angle = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x)
      setTransform(t => ({ ...t, scale: Math.max(.35, Math.min(4, gesture.current.base.scale * distance / gesture.current.distance)), rotate: gesture.current.base.rotate + (angle - gesture.current.angle) * 180 / Math.PI }))
    }
  }
  const pointerUp = e => { pointers.current.delete(e.pointerId); gesture.current = null }

  return <main id="main" className="workspace page-enter">
    <header className="workspace-bar"><IconButton label="Вернуться на главный экран" onClick={onBack}><ArrowLeft/></IconButton><div><strong>{project?.name || 'Новый рисунок'}</strong><small>{locked ? 'Положение зафиксировано' : 'Можно двигать и масштабировать'}</small></div><IconButton label="Сохранить проект" onClick={save}><Save/></IconButton></header>
    <section className={`canvas ${grid ? 'show-grid' : ''} ${locked ? 'is-locked' : ''}`} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp}>
      <video ref={videoRef} className="camera-feed" autoPlay muted playsInline aria-label="Живое изображение с камеры" />
      {cameraState !== 'ready' && <div className="camera-message" role="status"><Camera size={30}/><strong>{cameraState === 'loading' ? 'Включаем камеру…' : cameraState === 'denied' ? 'Доступ к камере закрыт' : cameraState === 'unsupported' ? 'Камера здесь недоступна' : 'Не удалось включить камеру'}</strong><span>{cameraState === 'loading' ? 'Разреши доступ к камере, когда браузер спросит.' : 'Открой приложение по HTTPS и разреши камеру в настройках браузера, затем перезагрузи страницу.'}</span></div>}
      <div className="canvas-vignette"/>
      <div className="trace-image" style={{ opacity: opacity / 100, transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale * transform.flip}, ${transform.scale}) rotate(${transform.rotate}deg)` }}>
        {source ? <img src={source} alt="Загруженный рисунок для срисовки" draggable="false"/> : <ProjectThumb type={project?.thumb || 'leaf'}/>} 
      </div>
      <div className="canvas-status"><span><ZoomIn size={15}/>{Math.round(transform.scale * 100)}%</span><span><RotateCw size={15}/>{Math.round(transform.rotate)}°</span></div>
      {locked && <div className="locked-pill"><Lock size={15}/>Зафиксировано</div>}
    </section>
    <section className="control-deck">
      <div className="opacity-head"><div><span>Прозрачность</span><strong>{opacity}%</strong></div><div className="quick-values">{[25,50,75,100].map(v => <button key={v} className={opacity === v ? 'active' : ''} onClick={() => setOpacity(v)}>{v}</button>)}</div></div>
      <div className="range-wrap"><Eye size={18}/><input aria-label="Прозрачность изображения" type="range" min="0" max="100" value={opacity} onChange={e => setOpacity(Number(e.target.value))} style={{ '--value': `${opacity}%` }}/><Sun size={18}/></div>
      <button className="tool-toggle" aria-expanded={tools} onClick={() => setTools(!tools)}><span>{tools ? 'Свернуть инструменты' : 'Показать инструменты'}</span><Menu size={18}/></button>
      {tools && <div className="tool-grid">
        <button onClick={onReplace}><ImagePlus/><span>Заменить</span></button>
        <button onClick={() => setTransform(t => ({ ...t, rotate: t.rotate + 90 }))}><RotateCw/><span>Повернуть</span></button>
        <button onClick={() => setTransform(t => ({ ...t, flip: t.flip * -1 }))}><FlipHorizontal2/><span>Отразить</span></button>
        <button className={grid ? 'active' : ''} aria-pressed={grid} onClick={() => setGrid(!grid)}><Grid3X3/><span>Сетка</span></button>
        <button className={locked ? 'active' : ''} aria-pressed={locked} onClick={() => { setLocked(!locked); flash(locked ? 'Рисунок разблокирован' : 'Рисунок зафиксирован') }}>{locked ? <Unlock/> : <Lock/>}<span>{locked ? 'Открыть' : 'Закрепить'}</span></button>
        <button onClick={reset}><RotateCcw/><span>Сбросить</span></button>
        <button onClick={save}><Save/><span>Сохранить</span></button>
        <button onClick={() => navigator.share?.({ title: 'Trace Neon', text: 'Мой проект в Trace Neon' }).catch(() => {})}><Share2/><span>Поделиться</span></button>
      </div>}
    </section>
    {toast && <Toast>{toast}</Toast>}
  </main>
}

function SettingsScreen({ onBack, onTutorial, theme, onTheme }) {
  return <main id="main" className="settings-screen page-enter"><header className="simple-header"><IconButton label="Назад" onClick={onBack}><ArrowLeft/></IconButton><h1>Настройки</h1><span/></header><section className="settings-group"><h2>Внешний вид</h2><button onClick={onTheme}><span className="settings-icon">{theme === 'dark' ? <Moon/> : <Sun/>}</span><span><strong>Тема</strong><small>{theme === 'dark' ? 'Тёмная' : 'Светлая'}</small></span><ChevronRight/></button></section><section className="settings-group"><h2>Помощь</h2><button onClick={onTutorial}><span className="settings-icon"><HelpCircle/></span><span><strong>Пройти обучение снова</strong><small>5 коротких шагов</small></span><ChevronRight/></button></section><p className="version">Trace Neon · версия 1.1</p></main>
}

function CropScreen({ source, onCancel, onUse }) {
  const [rotation, setRotation] = useState(0)
  const [crop, setCrop] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [aspect, setAspect] = useState(1)
  const [area, setArea] = useState(null)
  const [enhance, setEnhance] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function apply() {
    setBusy(true); setError('')
    try {
      const image = new Image(); image.src = source; await image.decode()
      const quarter = rotation % 180 !== 0
      const shrink = Math.min(1, 1600 / Math.max(image.width, image.height))
      const imageWidth = Math.max(1, Math.round(image.width * shrink))
      const imageHeight = Math.max(1, Math.round(image.height * shrink))
      const width = quarter ? imageHeight : imageWidth
      const height = quarter ? imageWidth : imageHeight
      const stage = document.createElement('canvas')
      stage.width = width; stage.height = height
      const context = stage.getContext('2d')
      context.translate(width / 2, height / 2)
      context.rotate(rotation * Math.PI / 180)
      if (enhance) context.filter = 'contrast(1.45) saturate(0.35) brightness(1.07)'
      context.drawImage(image, -imageWidth / 2, -imageHeight / 2, imageWidth, imageHeight)
      const output = document.createElement('canvas')
      if (crop && !area) throw new Error('Crop area is not ready')
      const left = crop ? Math.max(0, width * area.x / 100) : 0
      const top = crop ? Math.max(0, height * area.y / 100) : 0
      const outWidth = crop ? Math.min(width - left, width * area.width / 100) : width
      const outHeight = crop ? Math.min(height - top, height * area.height / 100) : height
      const scale = Math.min(1, 1200 / Math.max(outWidth, outHeight))
      output.width = Math.round(outWidth * scale); output.height = Math.round(outHeight * scale)
      output.getContext('2d').drawImage(stage, left, top, outWidth, outHeight, 0, 0, output.width, output.height)
      onUse(output.toDataURL('image/webp', .86))
    } catch { setError('Не удалось обработать изображение. Попробуй другой файл.') }
    finally { setBusy(false) }
  }
  return <main id="main" className="crop-screen page-enter"><header className="simple-header"><IconButton label="Отменить" onClick={onCancel}><X/></IconButton><h1>Подготовить рисунок</h1><span/></header><div className="crop-stage">{crop ? <Cropper image={source} crop={position} zoom={zoom} rotation={rotation} aspect={aspect} onCropChange={setPosition} onZoomChange={setZoom} onCropComplete={setArea} style={{ mediaStyle: { filter: enhance ? 'contrast(1.45) saturate(.35) brightness(1.07)' : 'none' } }} /> : <img src={source} alt="Предпросмотр выбранного рисунка" style={{ transform: `rotate(${rotation}deg)`, filter: enhance ? 'contrast(1.45) saturate(.35) brightness(1.07)' : 'none' }}/>}</div>{crop && <div className="crop-adjust"><p>Двигай изображение пальцем и меняй масштаб, чтобы выбрать нужную часть.</p><label>Масштаб <input type="range" aria-label="Масштаб обрезки" min="1" max="3" step="0.01" value={zoom} onChange={e => setZoom(Number(e.target.value))}/></label><div>{[[1,'Квадрат'],[3/4,'Портрет'],[4/3,'Альбом']].map(([value,label]) => <button key={label} className={aspect === value ? 'active' : ''} aria-pressed={aspect === value} onClick={() => setAspect(value)}>{label}</button>)}</div></div>}<section className="crop-options"><button className={crop ? 'active' : ''} aria-pressed={crop} onClick={() => setCrop(!crop)}><Crop/><span>Обрезать</span></button><button onClick={() => setRotation((rotation + 90) % 360)}><RotateCw/><span>Повернуть</span></button><button className={enhance ? 'active' : ''} aria-pressed={enhance} onClick={() => setEnhance(!enhance)}><Sparkles/><span>Улучшить</span></button></section><div className="quality-hint"><Sparkles size={18}/><p><strong>{crop ? 'Выбери область рисунка' : 'Исходные пропорции'}</strong><br/>{enhance ? 'Контраст и контуры усилены.' : 'Настрой рисунок перед открытием камеры.'}</p></div>{error && <p role="alert">{error}</p>}<footer className="crop-footer"><button className="primary-button" disabled={busy} onClick={apply}>{busy ? 'Обрабатываем…' : 'Использовать рисунок'}<Check size={20}/></button></footer></main>
}

export default function App() {
  const [screen, setScreen] = useState('splash')
  const [sheet, setSheet] = useState(false)
  const [source, setSource] = useState('')
  const [project, setProject] = useState(null)
  const [projects, setProjects] = useState(() => { try { return (JSON.parse(readStorage('trace-projects')) || []).filter(project => !['demo-1', 'demo-2'].includes(project.id)) } catch { return starterProjects } })
  const [theme, setTheme] = useState(() => readStorage('trace-theme') === 'light' ? 'light' : 'dark')
  const fileRef = useRef(null)
  const cameraRef = useRef(null)

  useEffect(() => { writeStorage('trace-projects', JSON.stringify(projects)) }, [projects])
  useEffect(() => { writeStorage('trace-theme', theme); document.documentElement.dataset.theme = theme }, [theme])
  const finishTutorial = () => { writeStorage('trace-onboarded-v3', 'yes'); setScreen('home') }
  const finishSplash = () => setScreen(readStorage('trace-onboarded-v3') ? 'home' : 'onboarding')
  const choose = type => { setSheet(false); (type === 'camera' ? cameraRef : fileRef).current?.click() }
  const fileChosen = e => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { setSource(reader.result); setScreen('crop') }; reader.readAsDataURL(file); e.target.value = '' }
  const saveProject = data => { const next = { ...data, source: source || project?.source || '', id: project?.id || `p-${Date.now()}`, date: 'Только что' }; setProject(next); setProjects(prev => [next, ...prev.filter(p => p.id !== next.id)].slice(0, 8)) }

  return <div className="app-shell" data-theme={theme}>
    <input ref={fileRef} className="visually-hidden" type="file" accept="image/*" onChange={fileChosen}/>
    <input ref={cameraRef} className="visually-hidden" type="file" accept="image/*" capture="environment" onChange={fileChosen}/>
    {screen === 'splash' && <Splash onDone={finishSplash}/>}
    {screen === 'onboarding' && <Onboarding onDone={finishTutorial}/>} 
    {screen === 'home' && <HomeScreen projects={projects} onPick={choose} onNew={() => setSheet(true)} onOpenProject={p => { setProject(p); setSource(p.source || ''); setScreen('workspace') }} onHelp={() => setScreen('onboarding')} onSettings={() => setScreen('settings')}/>} 
    {screen === 'crop' && <CropScreen source={source} onCancel={() => setScreen('home')} onUse={processed => { setSource(processed); setProject(null); setScreen('workspace') }}/>} 
    {screen === 'workspace' && <Workspace source={source} project={project} onBack={() => setScreen('home')} onSave={saveProject} onReplace={() => setSheet(true)}/>} 
    {screen === 'settings' && <SettingsScreen onBack={() => setScreen('home')} onTutorial={() => setScreen('onboarding')} theme={theme} onTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}/>} 
    {sheet && <AddSheet onClose={() => setSheet(false)} onPick={choose}/>} 
  </div>
}
