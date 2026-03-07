import { useCallback } from 'react'
import { useStore } from '../context/store'
import { DEFAULT_LAT, DEFAULT_LNG } from '../utils/constants'

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function extractExif(dataUrl) {
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

    // Read existing metadata fields
    const ifd0 = exifData['0th'] || {}
    const exifIfd = exifData['Exif'] || {}
    const description = ifd0[piexif.ImageIFD.ImageDescription] || ''

    // Decode UTF-16LE fields
    const { decodeUTF16LE } = await import('../utils/exif')
    const keywords = decodeUTF16LE(ifd0[piexif.ImageIFD.XPKeywords])
    const altText = decodeUTF16LE(ifd0[piexif.ImageIFD.XPComment])

    // Read timestamp
    let timestamp = ''
    const dateStr = exifIfd[piexif.ExifIFD.DateTimeOriginal] || ifd0[piexif.ImageIFD.DateTime] || ''
    if (dateStr) {
      // EXIF format: "YYYY:MM:DD HH:MM:SS"
      const parts = dateStr.match(/(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/)
      if (parts) {
        timestamp = `${parts[1]}-${parts[2]}-${parts[3]}T${parts[4]}:${parts[5]}:${parts[6]}`
      }
    }

    return { raw: exifData, lat, lng, description, keywords, altText, timestamp }
  } catch {
    return { raw: {}, lat: null, lng: null, description: '', keywords: '', altText: '', timestamp: '' }
  }
}

// Attempt HEIC/HEIF conversion (graceful degradation - spec §8)
async function tryConvertHeic(file) {
  if (typeof window === 'undefined') return null
  try {
    // heic2any is an optional dependency — if not installed, this fails gracefully
    const mod = await import('heic2any').catch(() => null)
    if (!mod) {
      console.warn('heic2any not available — HEIC files will be skipped')
      return null
    }
    const heic2any = mod.default
    const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 })
    const result = Array.isArray(blob) ? blob[0] : blob
    return new File([result], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' })
  } catch (e) {
    console.warn('HEIC conversion failed:', e.message || e)
    return null
  }
}

export function useImageLoader() {
  const { addImages } = useStore()

  const loadFiles = useCallback(async (fileList) => {
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const heicTypes = ['image/heic', 'image/heif']
    const allFiles = Array.from(fileList)

    const files = []
    const unsupported = []

    for (const f of allFiles) {
      if (supportedTypes.includes(f.type)) {
        files.push(f)
      } else if (heicTypes.includes(f.type) || /\.(heic|heif)$/i.test(f.name)) {
        // Try to convert HEIC/HEIF
        const converted = await tryConvertHeic(f)
        if (converted) files.push(converted)
        else unsupported.push(f.name)
      } else {
        unsupported.push(f.name)
      }
    }

    const loaded = []
    let geotaggedCount = 0

    for (const file of files) {
      const dataUrl = await readFileAsDataUrl(file)
      let originalExif = { raw: {}, lat: null, lng: null, description: '', keywords: '', altText: '', timestamp: '' }
      if (['image/jpeg', 'image/jpg'].includes(file.type)) {
        originalExif = await extractExif(dataUrl)
      }
      const origGps = originalExif.lat != null ? { lat: originalExif.lat, lng: originalExif.lng } : null
      if (origGps) geotaggedCount++

      loaded.push({
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl,
        originalExif: { raw: originalExif.raw, gps: origGps },
        editedGps: origGps || { lat: DEFAULT_LAT, lng: DEFAULT_LNG },
        processedDataUrl: null,
        processed: false,
        keywords: originalExif.keywords || '',
        description: originalExif.description || '',
        altText: originalExif.altText || '',
        timestamp: originalExif.timestamp || '',
      })
    }

    if (loaded.length) addImages(loaded)
    return {
      loaded: loaded.length,
      skipped: unsupported.length,
      geotagged: geotaggedCount,
      unsupportedNames: unsupported,
    }
  }, [addImages])

  return { loadFiles }
}
