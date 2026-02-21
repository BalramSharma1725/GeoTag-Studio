import { useCallback } from 'react'
import { useStore } from '../context/store'

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function extractExif(dataUrl) {
  function decodeUTF16LE(arr) {
    if (!arr) return ''
    try {
      // piexif returns a regular array of byte values
      const uint8 = new Uint8Array(arr)
      const text = new TextDecoder('utf-16le').decode(uint8)
      // strip trailing nulls
      return text.replace(/\0+$/, '')
    } catch {
      return ''
    }
  }

  try {
    const { default: piexif } = await import('piexifjs')
    const exifData = piexif.load(dataUrl)
    const gps = exifData['GPS']
    let lat = null, lng = null
    if (gps && gps[piexif.GPSIFD.GPSLatitude]) {
      const toDecimal = ([d, m, s]) => d[0]/d[1] + m[0]/m[1]/60 + s[0]/s[1]/3600
      const latRef = gps[piexif.GPSIFD.GPSLatitudeRef]
      const lngRef = gps[piexif.GPSIFD.GPSLongitudeRef]
      lat = toDecimal(gps[piexif.GPSIFD.GPSLatitude]) * (latRef === 'S' ? -1 : 1)
      lng = toDecimal(gps[piexif.GPSIFD.GPSLongitude]) * (lngRef === 'W' ? -1 : 1)
    }
    // Also read existing description/keywords/alt text if present
    const ifd0 = exifData['0th'] || {}
    const description = ifd0[piexif.ImageIFD.ImageDescription] || ''
    const keywords = decodeUTF16LE(ifd0[piexif.ImageIFD.XPKeywords])
    const altText = decodeUTF16LE(ifd0[piexif.ImageIFD.XPComment])
    return { raw: exifData, lat, lng, description, keywords, altText }
  } catch {
    return { raw: {}, lat: null, lng: null, description: '', keywords: '', altText: '' }
  }
}

export function useImageLoader() {
  const { addImages } = useStore()

  const loadFiles = useCallback(async (fileList) => {
    const files = Array.from(fileList).filter((f) =>
      ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(f.type)
    )
    const loaded = []
    for (const file of files) {
      const dataUrl = await readFileAsDataUrl(file)
      let originalExif = { raw: {}, lat: null, lng: null, description: '' }
      if (['image/jpeg', 'image/jpg'].includes(file.type)) {
        originalExif = await extractExif(dataUrl)
      }
      const origGps = originalExif.lat != null ? { lat: originalExif.lat, lng: originalExif.lng } : null
      loaded.push({
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl,
        // Store original EXIF GPS separately — store.addImages will apply persisted edits on top
        originalExif: { raw: originalExif.raw, gps: origGps },
        // Set editedGps to original — store will override with persisted if available
        editedGps: origGps,
        processedDataUrl: null,
        processed: false,
        // also keep whatever metadata we extracted so that addImages can default to it
        keywords: originalExif.keywords || '',
        description: originalExif.description || '',
        altText: originalExif.altText || '',
      })
    }
    if (loaded.length) addImages(loaded)
    return { loaded: loaded.length, skipped: fileList.length - files.length }
  }, [addImages])

  return { loadFiles }
}
