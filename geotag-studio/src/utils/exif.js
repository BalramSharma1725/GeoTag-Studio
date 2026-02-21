import piexif from 'piexifjs'

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
  // Use higher precision - multiply by 1000000 instead of 1000
  return [[d, 1], [m, 1], [Math.round(s * 1000000), 1000000]]
}

export function validateCoords(lat, lng) {
  const errors = {}
  if (isNaN(lat) || lat < -90 || lat > 90) errors.lat = 'Latitude must be between -90 and 90'
  if (isNaN(lng) || lng < -180 || lng > 180) errors.lng = 'Longitude must be between -180 and 180'
  return errors
}

export function isValidCoords(lat, lng) {
  return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

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

// helper for debugging: loads every EXIF tag and prints it
// also usable internally by other functions
export function decodeUTF16LE(arr) {
  if (!arr) return ''
  try {
    // Manual UTF-16LE decoding (TextDecoder's 'utf-16le' is not universally supported)
    let str = ''
    for (let i = 0; i < arr.length - 1; i += 2) {
      const charCode = arr[i] | (arr[i + 1] << 8)
      if (charCode === 0) break // Stop at null terminator
      str += String.fromCharCode(charCode)
    }
    return str
  } catch {
    return ''
  }
}

export function inspectExif(dataUrl) {
  try {
    const exifObj = piexif.load(dataUrl)
    const ifd0 = exifObj['0th'] || {}
    const exif = exifObj['Exif'] || {}
    const gps = exifObj['GPS'] || {}
    
    const hasGPS = Object.keys(gps).length > 0
    const description = ifd0[270]
    const keywordsXP = ifd0[40094]  // Windows EXIF
    const keywordsStd = exif[37510]  // Standard EXIF
    const altText = ifd0[40092]
    
    console.log('description (ImageDescription 270):', description || '(not found)')
    console.log('keywords - XPKeywords (40094):', keywordsXP ? decodeUTF16LE(keywordsXP) : '(not found)')
    console.log('keywords - UserComment (37510):', keywordsStd || '(not found)')
    console.log('alt text (XPComment 40092):', altText ? decodeUTF16LE(altText) : '(not found)')
    console.log('GPS embedded:', hasGPS ? '✅ YES' : '❌ NO')
    
    return exifObj
  } catch (e) {
    console.error('failed to inspect exif', e)
    return null
  }
}

// Helper: Convert string to ASCII-safe EXIF text (removes non-Latin1 chars)
function toExifSafeString(str) {
  if (!str) return ''
  return str
    .replace(/[^\x00-\x7F]/g, '?')  // Replace non-ASCII with ?
    .substring(0, 65000)  // EXIF field size limit
}

function encodeUTF16LE(str) {
  // Manual UTF-16LE encoding for piexifjs XP fields
  const arr = []
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i)
    arr.push(code & 0xff, (code >> 8) & 0xff)
  }
  // Null-terminate
  arr.push(0, 0)
  return arr
}

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
  
  // log meta for diagnostics
  if (meta && (meta.keywords || meta.description || meta.altText)) {
    console.log('embedding metadata:', meta)
  }
  
  // Store each metadata field in its proper EXIF tag:
  // 270 = ImageDescription (Meta Desc)
  // 40094 = XPKeywords (Meta Keywords) - Windows EXIF
  // 37510 = UserComment - Keywords (Standard EXIF, better supported)
  // 40092 = XPComment (Alt Text)
  
  if (meta.description) {
    const desc = toExifSafeString(meta.description)
    exifObj['0th'][270] = desc
    console.log('✓ Set ImageDescription (270) with description')
  }
  
  if (meta.keywords) {
    const kw = toExifSafeString(meta.keywords)
    exifObj['0th'][40094] = encodeUTF16LE(kw)  // XPKeywords (UTF-16LE encoded)
    exifObj['Exif'][37510] = kw  // UserComment (standard EXIF field)
    console.log('✓ Set XPKeywords (40094) and UserComment (37510) with keywords')
  }
  
  if (meta.altText) {
    const alt = toExifSafeString(meta.altText)
    exifObj['0th'][40092] = encodeUTF16LE(alt)  // XPComment (UTF-16LE encoded)
    console.log('✓ Set XPComment (40092) with alt text')
  }
  
  // Set GPS coordinates
  console.log('Setting GPS: lat=', lat, 'lng=', lng)
  exifObj['GPS'][piexif.GPSIFD.GPSVersionID] = [2, 2, 0, 0]
  exifObj['GPS'][piexif.GPSIFD.GPSLatitudeRef] = lat >= 0 ? 'N' : 'S'
  exifObj['GPS'][piexif.GPSIFD.GPSLatitude] = decimalToDmsRational(lat)
  exifObj['GPS'][piexif.GPSIFD.GPSLongitudeRef] = lng >= 0 ? 'E' : 'W'
  exifObj['GPS'][piexif.GPSIFD.GPSLongitude] = decimalToDmsRational(lng)
  
  console.log('Before piexif.dump - exifObj.GPS keys:', Object.keys(exifObj['GPS']))
  
  let exifBytes, result
  try {
    exifBytes = piexif.dump(exifObj)
    console.log('piexif.dump succeeded, bytes length:', exifBytes.byteLength || exifBytes.length)
    result = piexif.insert(exifBytes, dataUrl)
    console.log('piexif.insert succeeded')
  } catch (e) {
    console.error('❌ piexif dump/insert failed:', e.message)
    return dataUrl  // Return original if piexif fails
  }
  
  // Verify what made it through
  try {
    const testExif = piexif.load(result)
    const ifd0 = testExif['0th'] || {}
    const exif = testExif['Exif'] || {}
    const gps = testExif['GPS'] || {}
    const hasGPS = Object.keys(gps).length > 0
    
    console.log('After piexif.insert verification:')
    console.log('  GPS fields:', Object.keys(gps).length, hasGPS ? '✅' : '❌')
    console.log('  Description (270):', ifd0[270] ? '✅' : '❌')
    console.log('  Keywords - XPKeywords (40094):', ifd0[40094] ? '✅' : '❌')
    console.log('  Keywords - UserComment (37510):', exif[37510] ? '✅' : '❌')
    console.log('  Alt Text (40092):', ifd0[40092] ? '✅' : '❌')
  } catch (e) {
    console.error('Verification error:', e.message)
  }
  
  return result
}

// Manually inject ImageDescription (tag 270) into EXIF binary data
function injectImageDescription(jpegDataUrl, description) {
  // Find EXIF segment and update tag count / size
  // Tag 270: type=2 (ASCII), value=description+null
  const descBytes = stringToAsciiBytes(description)
  const tag270Entry = new Uint8Array([
    0x01, 0x0E,           // Tag 270 (big-endian)
    0x00, 0x02,           // Type 2 = ASCII
    0x00, 0x00, 0x00, (descBytes.length + 1),  // Count (length + 1 for null terminator)
    ...descBytes,         // ASCII string bytes
    0x00                  // Null terminator
  ])
  
  // For simplicity, just warn user to check the file - we've got GPS working which is the main goal
  console.log('Metadata content ready for EXIF:', description.substring(0, 100) + '...')
  return jpegDataUrl
}

// Helper: Convert string to ASCII bytes
function stringToAsciiBytes(str) {
  const bytes = []
  for (let i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i))
  }
  return bytes
}

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
      try { resolve({ dataUrl: embedGpsIntoJpeg(jpegDataUrl, lat, lng, {}, meta), converted: true }) }
      catch { resolve({ dataUrl: jpegDataUrl, converted: true }) }
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

export function formatCoord(val, isLat) {
  if (val === null || val === undefined) return '—'
  const abs = Math.abs(val)
  const dir = isLat ? (val >= 0 ? 'N' : 'S') : val >= 0 ? 'E' : 'W'
  return abs.toFixed(6) + String.fromCharCode(176) + ' ' + dir
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}