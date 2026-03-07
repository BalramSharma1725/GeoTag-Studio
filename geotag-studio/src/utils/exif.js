import piexif from 'piexifjs'

// ===== GPS DMS ↔ Decimal =====
export function dmsToDecimal(dmsRational, ref) {
  const [d, m, s] = dmsRational.map(([num, den]) => num / den)
  let decimal = d + m / 60 + s / 3600
  if (ref === 'S' || ref === 'W') decimal = -decimal
  return decimal
}

export function decimalToDmsRational(decimal) {
  const abs = Math.abs(decimal)
  const d = Math.floor(abs)
  const minFull = (abs - d) * 60
  const m = Math.floor(minFull)
  const s = (minFull - m) * 60
  return [[d, 1], [m, 1], [Math.round(s * 1000000), 1000000]]
}

// ===== Coordinate Validation =====
export function validateCoords(lat, lng) {
  const errors = {}
  if (isNaN(lat) || lat < -90 || lat > 90) errors.lat = 'Latitude must be between -90 and 90'
  if (isNaN(lng) || lng < -180 || lng > 180) errors.lng = 'Longitude must be between -180 and 180'
  return errors
}

export function isValidCoords(lat, lng) {
  return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

// ===== UTF-16LE Encoding/Decoding (spec §3.4 fix) =====
export function decodeUTF16LE(arr) {
  if (!arr) return ''
  try {
    let str = ''
    for (let i = 0; i < arr.length - 1; i += 2) {
      const charCode = arr[i] | (arr[i + 1] << 8)
      if (charCode === 0) break
      str += String.fromCharCode(charCode)
    }
    return str
  } catch { return '' }
}

function encodeUTF16LE(str) {
  const arr = []
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i)
    arr.push(code & 0xff, (code >> 8) & 0xff)
  }
  arr.push(0, 0) // null-terminate
  return arr
}

// Spec §3.4: UserComment with UNICODE charset prefix
function makeUnicodeUserComment(str) {
  const prefix = new Uint8Array([85, 78, 73, 67, 79, 68, 69, 0]) // "UNICODE\0"
  const encoder = new TextEncoder()
  const encoded = encoder.encode(str)
  const result = new Uint8Array(prefix.length + encoded.length)
  result.set(prefix)
  result.set(encoded, prefix.length)
  return Array.from(result)
}

function toExifSafeString(str) {
  if (!str) return ''
  return str.replace(/[^\x00-\x7F]/g, '?').substring(0, 65000)
}

// ===== Read EXIF from a JPEG data URL =====
export function readExifFromDataUrl(dataUrl, mimeType) {
  if (!['image/jpeg', 'image/jpg'].includes(mimeType)) return { gps: null, raw: {} }
  try {
    const exifObj = piexif.load(dataUrl)
    const gps = exifObj['GPS']
    if (!gps || gps[piexif.GPSIFD.GPSLatitude] === undefined) return { gps: null, raw: exifObj }
    const lat = dmsToDecimal(gps[piexif.GPSIFD.GPSLatitude], gps[piexif.GPSIFD.GPSLatitudeRef])
    const lng = dmsToDecimal(gps[piexif.GPSIFD.GPSLongitude], gps[piexif.GPSIFD.GPSLongitudeRef])
    return { gps: { lat, lng }, raw: exifObj }
  } catch { return { gps: null, raw: {} } }
}

// ===== Embed GPS + Metadata into JPEG =====
export function embedGpsIntoJpeg(dataUrl, lat, lng, existingRaw, meta) {
  if (!existingRaw) existingRaw = {}
  if (!meta) meta = {}

  let exifObj
  try {
    exifObj = existingRaw && Object.keys(existingRaw).length > 0
      ? JSON.parse(JSON.stringify(existingRaw))
      : { '0th': {}, Exif: {}, GPS: {}, '1st': {} }
  } catch { exifObj = { '0th': {}, Exif: {}, GPS: {}, '1st': {} } }
  if (!exifObj['GPS']) exifObj['GPS'] = {}
  if (!exifObj['0th']) exifObj['0th'] = {}
  if (!exifObj['Exif']) exifObj['Exif'] = {}

  // ===== Write Description (EXIF ImageDescription 0x010E) =====
  if (meta.description) {
    exifObj['0th'][piexif.ImageIFD.ImageDescription] = toExifSafeString(meta.description)
  }

  // ===== Write Keywords (XPKeywords 40094 + UserComment 37510) =====
  if (meta.keywords) {
    const kw = toExifSafeString(meta.keywords)
    exifObj['0th'][40094] = encodeUTF16LE(kw)
    exifObj['Exif'][piexif.ExifIFD.UserComment] = makeUnicodeUserComment(kw)
  }

  // ===== Write Alt Text (spec §3.4) =====
  // Write to ImageDescription AND UserComment with UNICODE prefix
  if (meta.altText && meta.altText.trim().length > 0) {
    const ascii = meta.altText.normalize('NFC').slice(0, 255)
    exifObj['0th'][piexif.ImageIFD.ImageDescription] = ascii
    exifObj['0th'][40092] = encodeUTF16LE(meta.altText) // XPComment
    // If no keywords already set UserComment, use altText for it
    if (!meta.keywords) {
      exifObj['Exif'][piexif.ExifIFD.UserComment] = makeUnicodeUserComment(meta.altText)
    }
  }

  // ===== Write Timestamp if provided =====
  if (meta.timestamp) {
    try {
      const d = new Date(meta.timestamp)
      if (!isNaN(d.getTime())) {
        const fmt = `${d.getFullYear()}:${String(d.getMonth()+1).padStart(2,'0')}:${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`
        exifObj['Exif'][piexif.ExifIFD.DateTimeOriginal] = fmt
        exifObj['Exif'][piexif.ExifIFD.DateTimeDigitized] = fmt
        exifObj['0th'][piexif.ImageIFD.DateTime] = fmt
      }
    } catch { /* ignore invalid timestamp */ }
  }

  // ===== Write GPS =====
  exifObj['GPS'][piexif.GPSIFD.GPSVersionID] = [2, 2, 0, 0]
  exifObj['GPS'][piexif.GPSIFD.GPSLatitudeRef] = lat >= 0 ? 'N' : 'S'
  exifObj['GPS'][piexif.GPSIFD.GPSLatitude] = decimalToDmsRational(lat)
  exifObj['GPS'][piexif.GPSIFD.GPSLongitudeRef] = lng >= 0 ? 'E' : 'W'
  exifObj['GPS'][piexif.GPSIFD.GPSLongitude] = decimalToDmsRational(lng)

  try {
    const exifBytes = piexif.dump(exifObj)
    return piexif.insert(exifBytes, dataUrl)
  } catch (e) {
    console.error('EXIF write failed:', e.message)
    return dataUrl
  }
}

// ===== Convert non-JPEG to JPEG, then embed GPS =====
export function convertAndEmbedGps(dataUrl, lat, lng, meta) {
  if (!meta) meta = {}
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      canvas.getContext('2d').drawImage(img, 0, 0)
      const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.95)
      try {
        resolve({ dataUrl: embedGpsIntoJpeg(jpegDataUrl, lat, lng, {}, meta), converted: true })
      } catch {
        resolve({ dataUrl: jpegDataUrl, converted: true })
      }
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

// ===== Formatting Utilities =====
export function formatCoord(val, isLat) {
  if (val === null || val === undefined) return '—'
  const abs = Math.abs(val)
  const dir = isLat ? (val >= 0 ? 'N' : 'S') : val >= 0 ? 'E' : 'W'
  return abs.toFixed(6) + '° ' + dir
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}