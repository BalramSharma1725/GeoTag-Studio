import { useState, useCallback } from 'react'
import { useStore } from '../context/store'
import { embedGpsIntoJpeg, convertAndEmbedGps, inspectExif } from '../utils/exif'

export function useProcessor() {
  const { images, setProcessed } = useStore()
  const [progress, setProgress] = useState(null)

  const processImages = useCallback(async (ids) => {
    // Process all requested images — even those without GPS (to embed meta only)
    const targets = images.filter((i) => ids.includes(i.id))
    if (!targets.length) return
    setProgress({ current: 0, total: targets.length })
    for (let i = 0; i < targets.length; i++) {
      const img = targets[i]
      setProgress({ current: i + 1, total: targets.length, name: img.name })
      // Skip if no GPS and no meta to embed
      const hasMeta = img.keywords || img.description || img.altText
      if (!img.editedGps && !hasMeta) {
        setProcessed(img.id, img.dataUrl)
        continue
      }
      try {
        const meta = {
          keywords: img.keywords || '',
          description: img.description || '',
          altText: img.altText || '',
        }
        const lat = img.editedGps ? img.editedGps.lat : 0
        const lng = img.editedGps ? img.editedGps.lng : 0
        let processedDataUrl
        if (['image/jpeg', 'image/jpg'].includes(img.type)) {
          processedDataUrl = embedGpsIntoJpeg(
            img.dataUrl, lat, lng,
            img.originalExif ? img.originalExif.raw || {} : {},
            meta
          )
        } else {
          const res = await convertAndEmbedGps(img.dataUrl, lat, lng, meta)
          processedDataUrl = res.dataUrl
        }
        // Diagnostic: inspect EXIF of processed image
        try {
          console.log('--- Inspecting EXIF of processed image:', img.name)
          inspectExif(processedDataUrl)
        } catch (e) {
          console.error('EXIF inspection failed:', e)
        }
        setProcessed(img.id, processedDataUrl)
      } catch (err) {
        console.error('Failed to process', img.name, err)
      }
    }
    setProgress(null)
  }, [images, setProcessed])

  const clearProgress = useCallback(() => setProgress(null), [])
  return { processImages, progress, clearProgress }
}
