import React from 'react'

export default function useMeta(initialMeta = {}) {
  const [meta, setRawMeta] = React.useState(initialMeta)
  const setMeta = meta => {
    if (meta == null) {
      setRawMeta({})
      return
    }
    if (typeof meta !== 'object' && typeof meta !== 'function') {
      throw new Error('meta must be an object or function')
    }
    setRawMeta(prevMeta => {
      if (typeof meta === 'function') {
        meta = meta(prevMeta)
      }
      const newMeta = { ...prevMeta, ...meta }
      for (let [key, value] of Object.entries(newMeta)) {
        if (value === undefined) {
          delete meta[key]
        }
      }
      return newMeta
    })
  }
  return [meta, setMeta]
}
