import { useState, useCallback } from 'react'
import { useStore } from '../context/store'
import { embedGpsIntoJpeg, convertAndEmbedGps } from '../utils/exif'
import { DEFAULT_LAT, DEFAULT_LNG } from '../utils/constants'

export function useProcessor() {
  const { images, setProcessed } = useStore()
  const [progress, setProgress] = useState(null)

  const processImages = useCallback(async (ids) => {
    const targets = images.filter((i) => ids.includes(i.id))
    if (!targets.length) return
    setProgress({ current: 0, total: targets.length })

    for (let i = 0; i < targets.length; i++) {
      const img = targets[i]
      setProgress({ current: i + 1, total: targets.length, name: img.name })

      const hasMeta = img.keywords || img.description || img.altText || img.timestamp
      if (!img.editedGps && !hasMeta) {
        setProcessed(img.id, img.dataUrl)
        continue
      }

      try {
        const meta = {
          keywords: img.keywords || '',
          description: img.description || '',
          altText: img.altText || '',
          timestamp: img.timestamp || '',
        }
        const lat = img.editedGps ? img.editedGps.lat : DEFAULT_LAT
        const lng = img.editedGps ? img.editedGps.lng : DEFAULT_LNG
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
