import { useEffect, useMemo, useRef, useState } from 'react'
import maplibregl, { Map, Popup } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  Check,
  Download,
  Filter,
  LocateFixed,
  MapPin,
  Mountain,
  RotateCcw,
  Search,
  Upload,
  X,
} from 'lucide-react'
import './App.css'
import { AREAS, TOTAL_WAINWRIGHTS, WAINWRIGHTS, type Wainwright } from './data/wainwrights'

const STORAGE_KEY = 'wainwright-tracker:v1:completed'
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

function loadCompleted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return new Set<string>(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set<string>()
  }
}

function saveCompleted(completed: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(completed).sort()))
}

function peakFeature(peak: Wainwright, done: boolean) {
  return {
    type: 'Feature' as const,
    geometry: { type: 'Point' as const, coordinates: [peak.longitude, peak.latitude] },
    properties: {
      id: peak.id,
      name: peak.name,
      heightMetres: peak.heightMetres,
      heightFt: peak.heightFt,
      gridReference: peak.gridReference,
      area: peak.area,
      done,
    },
  }
}

function progressPercent(count: number) {
  return (count / TOTAL_WAINWRIGHTS) * 100
}

function formatPercent(count: number) {
  const percent = progressPercent(count)
  if (count > 0 && percent < 10) return percent.toFixed(1)
  return Math.round(percent).toString()
}

function App() {
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<Map | null>(null)
  const popupRef = useRef<Popup | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [completed, setCompleted] = useState<Set<string>>(() => loadCompleted())
  const [query, setQuery] = useState('')
  const [area, setArea] = useState('All')
  const [showOnly, setShowOnly] = useState<'all' | 'done' | 'todo'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [topoEnabled, setTopoEnabled] = useState(true)

  const selectedPeak = useMemo(
    () => WAINWRIGHTS.find((peak) => peak.id === selectedId) ?? null,
    [selectedId],
  )

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return WAINWRIGHTS.filter((peak) => {
      const done = completed.has(peak.id)
      const matchesSearch =
        !needle ||
        peak.name.toLowerCase().includes(needle) ||
        peak.gridReference.toLowerCase().includes(needle) ||
        peak.area.toLowerCase().includes(needle)
      const matchesArea = area === 'All' || peak.area === area
      const matchesDone = showOnly === 'all' || (showOnly === 'done' ? done : !done)
      return matchesSearch && matchesArea && matchesDone
    }).sort((a, b) => Number(completed.has(a.id)) - Number(completed.has(b.id)) || b.heightMetres - a.heightMetres)
  }, [area, completed, query, showOnly])

  const geojson = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: filtered.map((peak) => peakFeature(peak, completed.has(peak.id))),
    }),
    [completed, filtered],
  )

  const doneCount = completed.size
  const highestDone = useMemo(
    () => WAINWRIGHTS.filter((peak) => completed.has(peak.id)).sort((a, b) => b.heightMetres - a.heightMetres)[0],
    [completed],
  )

  useEffect(() => saveCompleted(completed), [completed])

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: [-3.12, 54.52],
      zoom: 8.8,
      maxZoom: 16,
      minZoom: 7,
      attributionControl: false,
    })

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right')
    map.addControl(new maplibregl.GeolocateControl({ trackUserLocation: true, positionOptions: { enableHighAccuracy: true } }), 'bottom-right')
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left')

    map.on('load', () => {
      map.addSource('topo', {
        type: 'raster',
        tiles: ['https://tile.opentopomap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: 'Map data: © OpenStreetMap contributors, SRTM | Style: © OpenTopoMap (CC-BY-SA)',
      })
      map.addLayer({ id: 'topo-layer', type: 'raster', source: 'topo', paint: { 'raster-opacity': 0.42, 'raster-saturation': -0.1 } })

      map.addSource('peaks', {
        type: 'geojson',
        data: geojson,
        cluster: true,
        clusterRadius: 42,
        clusterMaxZoom: 11,
      })

      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'peaks',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': ['step', ['get', 'point_count'], '#88d498', 12, '#f6c177', 30, '#eb6f92'],
          'circle-radius': ['step', ['get', 'point_count'], 18, 12, 24, 30, 31],
          'circle-stroke-width': 3,
          'circle-stroke-color': '#fffaf0',
        },
      })
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'peaks',
        filter: ['has', 'point_count'],
        layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-font': ['Noto Sans Bold'], 'text-size': 13 },
        paint: { 'text-color': '#182016' },
      })
      map.addLayer({
        id: 'peaks-shadow',
        type: 'circle',
        source: 'peaks',
        filter: ['!', ['has', 'point_count']],
        paint: { 'circle-radius': 10, 'circle-color': '#000', 'circle-opacity': 0.16, 'circle-translate': [0, 2] },
      })
      map.addLayer({
        id: 'peaks',
        type: 'circle',
        source: 'peaks',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': ['case', ['boolean', ['get', 'done'], false], 8, 7],
          'circle-color': ['case', ['boolean', ['get', 'done'], false], '#2fbf71', '#fff8e6'],
          'circle-stroke-color': ['case', ['boolean', ['get', 'done'], false], '#0b5d3b', '#2a2118'],
          'circle-stroke-width': ['case', ['boolean', ['get', 'done'], false], 2.5, 1.5],
        },
      })

      map.on('click', 'clusters', (event) => {
        const features = map.queryRenderedFeatures(event.point, { layers: ['clusters'] })
        const clusterId = features[0]?.properties?.cluster_id
        const source = map.getSource('peaks') as maplibregl.GeoJSONSource
        if (clusterId === undefined) return
        source.getClusterExpansionZoom(clusterId).then((zoom) => {
          map.easeTo({ center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number], zoom })
        })
      })

      map.on('click', 'peaks', (event) => {
        const feature = event.features?.[0]
        const id = feature?.properties?.id
        if (typeof id === 'string') setSelectedId(id)
      })

      map.on('mouseenter', 'peaks', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'peaks', () => { map.getCanvas().style.cursor = '' })
      map.on('mouseenter', 'clusters', () => { map.getCanvas().style.cursor = 'zoom-in' })
      map.on('mouseleave', 'clusters', () => { map.getCanvas().style.cursor = '' })

      setMapReady(true)
    })

    mapRef.current = map
    return () => {
      popupRef.current?.remove()
      popupRef.current = null
      mapRef.current = null
      map.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const source = mapReady ? (mapRef.current?.getSource('peaks') as maplibregl.GeoJSONSource | undefined) : undefined
    source?.setData(geojson)
  }, [geojson, mapReady])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    if (map.getLayer('topo-layer')) map.setLayoutProperty('topo-layer', 'visibility', topoEnabled ? 'visible' : 'none')
  }, [topoEnabled, mapReady])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedPeak) return
    map.easeTo({ center: [selectedPeak.longitude, selectedPeak.latitude], zoom: Math.max(map.getZoom(), 12.2), duration: 850 })
    popupRef.current?.remove()
    popupRef.current = new maplibregl.Popup({ closeButton: false, offset: 18, className: 'peak-popup' })
      .setLngLat([selectedPeak.longitude, selectedPeak.latitude])
      .setHTML(`<strong>${selectedPeak.name}</strong><span>${selectedPeak.heightMetres}m · ${selectedPeak.gridReference}</span>`)
      .addTo(map)
  }, [selectedPeak])

  const togglePeak = (id: string) => {
    setCompleted((previous) => {
      const next = new Set(previous)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const fitLakeDistrict = () => {
    mapRef.current?.fitBounds([[-3.42, 54.31], [-2.74, 54.75]], { padding: 48, duration: 900 })
  }

  const exportProgress = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      completed: Array.from(completed).sort(),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'wainwright-progress.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const importProgress = async (file: File) => {
    const json = JSON.parse(await file.text())
    const ids = Array.isArray(json) ? json : json.completed
    if (!Array.isArray(ids)) return
    const valid = new Set(WAINWRIGHTS.map((peak) => peak.id))
    setCompleted(new Set(ids.filter((id: unknown) => typeof id === 'string' && valid.has(id))))
  }

  return (
    <main className="app-shell">
      <section className="map-panel" aria-label="Wainwright map">
        <div ref={mapContainer} className="map-canvas" />
        <div className="map-glass top-left">
          <Mountain size={22} />
          <div>
            <span className="eyebrow">Lake District</span>
            <strong>Wainwright tracker</strong>
          </div>
        </div>
        <div className="map-actions">
          <button onClick={fitLakeDistrict} type="button"><LocateFixed size={17} /> Re-centre</button>
          <button className={topoEnabled ? 'active' : ''} onClick={() => setTopoEnabled((value) => !value)} type="button"><MapPin size={17} /> Topo</button>
        </div>
      </section>

      <aside className="sidebar">
        <header className="hero-card">
          <div>
            <p className="eyebrow">214 classic fells</p>
            <h1>{doneCount} / {TOTAL_WAINWRIGHTS}</h1>
            <p>{formatPercent(doneCount)}% complete{highestDone ? ` · highest bagged: ${highestDone.name}` : ' · start bagging the fells'}</p>
          </div>
          <div className="progress-ring" style={{ '--progress': `${formatPercent(doneCount)}%` } as React.CSSProperties}>
            <span>{formatPercent(doneCount)}%</span>
          </div>
          <div className="progress-bar"><span style={{ width: `${formatPercent(doneCount)}%` }} /></div>
        </header>

        <div className="toolbox">
          <label className="searchbox">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search fell, grid ref, area…" />
            {query && <button aria-label="Clear search" onClick={() => setQuery('')} type="button"><X size={16} /></button>}
          </label>
          <div className="filters">
            <label>
              <Filter size={16} />
              <select value={area} onChange={(event) => setArea(event.target.value)}>
                <option>All</option>
                {AREAS.map((areaName) => <option key={areaName}>{areaName}</option>)}
              </select>
            </label>
            <div className="segmented" role="group" aria-label="Completion filter">
              {(['all', 'todo', 'done'] as const).map((option) => (
                <button className={showOnly === option ? 'active' : ''} key={option} onClick={() => setShowOnly(option)} type="button">{option}</button>
              ))}
            </div>
          </div>
          <div className="io-actions">
            <button onClick={exportProgress} type="button"><Download size={16} /> Export</button>
            <button onClick={() => fileInputRef.current?.click()} type="button"><Upload size={16} /> Import</button>
            <button onClick={() => setCompleted(new Set())} type="button"><RotateCcw size={16} /> Reset</button>
            <input ref={fileInputRef} hidden type="file" accept="application/json" onChange={(event) => event.target.files?.[0] && importProgress(event.target.files[0])} />
          </div>
        </div>

        <div className="results-meta">
          <span>{filtered.length} shown</span>
          <span>{WAINWRIGHTS.length - doneCount} remaining</span>
        </div>

        <ol className="peak-list">
          {filtered.map((peak) => {
            const done = completed.has(peak.id)
            return (
              <li key={peak.id} className={`${selectedId === peak.id ? 'selected' : ''} ${done ? 'done' : ''}`}>
                <button className="peak-main" onClick={() => setSelectedId(peak.id)} type="button">
                  <span className="peak-name">{peak.name}</span>
                  <span className="peak-details">{peak.heightMetres}m / {peak.heightFt}ft · {peak.gridReference} · {peak.area}</span>
                </button>
                <button className="check-button" aria-label={done ? `Mark ${peak.name} not done` : `Mark ${peak.name} done`} onClick={() => togglePeak(peak.id)} type="button">
                  {done ? <Check size={18} /> : <span />}
                </button>
              </li>
            )
          })}
        </ol>

        <footer>
          Data: thomaswilsonxyz/wainwright-peaks + Database of British and Irish Hills, CC BY 4.0. Progress is stored locally in this browser.
        </footer>
      </aside>
    </main>
  )
}

export default App
